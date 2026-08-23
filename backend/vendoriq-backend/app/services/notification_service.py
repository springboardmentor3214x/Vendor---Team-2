import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from sqlalchemy.orm import Session

from app.models.notification import Notification, NotificationType, NotificationChannel
from app.models.user import User
from app.config import settings

logger = logging.getLogger("vendoriq.notifications")


def create_notification(
    db: Session,
    user_id: str,
    title: str,
    message: str,
    type: NotificationType = NotificationType.SYSTEM,
    channel: NotificationChannel = NotificationChannel.IN_APP,
    link: str | None = None,
) -> Notification:
    notif = Notification(
        user_id=user_id, title=title, message=message, type=type, channel=channel, link=link
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)

    if channel == NotificationChannel.EMAIL:
        notif.sent = _send_email_to_user(db, user_id, title, message)
    elif channel == NotificationChannel.SMS:
        notif.sent = _send_sms_to_user(db, user_id, message)
    else:
        notif.sent = True

    db.commit()
    db.refresh(notif)
    return notif


def _send_email_to_user(db: Session, user_id: str, subject: str, body: str) -> bool:
    """Looks up the user's real email and sends via SMTP. Returns whether it
    actually sent — never raises, since a failed notification shouldn't
    fail the request that triggered it."""
    if not settings.SMTP_HOST:
        logger.info("SMTP not configured; skipping email to user %s: %s", user_id, subject)
        return False

    user = db.get(User, user_id)
    if not user or not user.email:
        logger.warning("Cannot send email — user %s not found or has no email", user_id)
        return False

    try:
        msg = MIMEMultipart()
        msg["From"] = settings.SMTP_FROM or settings.SMTP_USER or "noreply@vendoriq.local"
        msg["To"] = user.email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            if settings.SMTP_TLS:
                server.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(msg["From"], [user.email], msg.as_string())

        logger.info("Email sent to %s: %s", user.email, subject)
        return True
    except Exception:
        logger.exception("Failed to send email to user %s (%s)", user_id, user.email)
        return False


def _send_sms_to_user(db: Session, user_id: str, body: str) -> bool:
    """Looks up the user's real phone number and sends via Twilio. Returns
    whether it actually sent — never raises."""
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
        logger.info("Twilio not configured; skipping SMS to user %s", user_id)
        return False

    user = db.get(User, user_id)
    if not user or not user.phone:
        logger.warning("Cannot send SMS — user %s not found or has no phone number", user_id)
        return False

    try:
        from twilio.rest import Client  # imported lazily so the package is only required when SMS is actually used

        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        client.messages.create(body=body, from_=settings.TWILIO_FROM_NUMBER, to=user.phone)
        logger.info("SMS sent to %s", user.phone)
        return True
    except Exception:
        logger.exception("Failed to send SMS to user %s (%s)", user_id, user.phone)
        return False
