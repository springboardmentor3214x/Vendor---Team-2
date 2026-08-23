"""
Seed script: creates an initial administrator account and a couple of
demo vendors so the API and frontend have data to work with.

Usage:
    python -m app.seed
"""
from datetime import datetime, timezone

from app.database import SessionLocal, Base, engine
from app import models  # noqa: F401
from app.core.security import hash_password
from app.models.user import User, RoleEnum
from app.models.vendor import Vendor, VendorCategory, VendorStatus


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.email == "admin@vendoriq.com").first():
            admin = User(
                full_name="Platform Administrator",
                email="admin@vendoriq.com",
                hashed_password=hash_password("ChangeMe123!"),
                role=RoleEnum.ADMINISTRATOR,
                is_active=True,
                is_verified=True,
            )
            db.add(admin)
            print("Created admin user: admin@vendoriq.com / ChangeMe123!")

        demo_vendors = [
            ("Northbridge Steel Co.", VendorCategory.RAW_MATERIAL_SUPPLIER, "sales@northbridgesteel.com"),
            ("Apex IT Solutions", VendorCategory.IT_VENDOR, "contact@apexit.com"),
            ("SwiftLine Logistics", VendorCategory.LOGISTICS_PARTNER, "ops@swiftline.com"),
        ]
        for name, category, email in demo_vendors:
            if not db.query(Vendor).filter(Vendor.contact_email == email).first():
                db.add(Vendor(
                    company_name=name,
                    category=category,
                    contact_email=email,
                    status=VendorStatus.APPROVED,
                    approved_at=datetime.now(timezone.utc),
                ))
                print(f"Created demo vendor: {name}")

        db.commit()
        print("Seeding complete.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
