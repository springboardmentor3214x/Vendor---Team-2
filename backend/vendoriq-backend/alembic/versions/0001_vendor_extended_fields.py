"""add extended vendor fields (GST/PAN/bank/contact) and vendor_documents table

Revision ID: 0001_vendor_ext
Revises:
Create Date: 2026-08-16

This migration is additive-only. If your database was created via the
app's dev-mode `Base.metadata.create_all()` startup hook rather than
Alembic (i.e. you never ran `alembic upgrade head` before), the base
tables (vendors, users, purchase_orders, etc.) already exist — this
migration only adds the new vendor columns and the new
`vendor_documents` table on top of that.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0001_vendor_ext"
down_revision = None
branch_labels = None
depends_on = None


NEW_VENDOR_COLUMNS = [
    ("designation", sa.String(150)),
    ("alternate_phone", sa.String(30)),
    ("address_line2", sa.String(255)),
    ("gst_number", sa.String(30)),
    ("pan_number", sa.String(20)),
    ("bank_account_number", sa.String(50)),
    ("ifsc_code", sa.String(20)),
    ("bank_name", sa.String(150)),
    ("payment_terms", sa.String(50)),
]


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = inspector.get_table_names()

    if "vendors" in existing_tables:
        existing_columns = {c["name"] for c in inspector.get_columns("vendors")}
        with op.batch_alter_table("vendors") as batch_op:
            for name, col_type in NEW_VENDOR_COLUMNS:
                if name not in existing_columns:
                    batch_op.add_column(sa.Column(name, col_type, nullable=True))

    if "vendor_documents" not in existing_tables:
        op.create_table(
            "vendor_documents",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("vendor_id", sa.String(36), sa.ForeignKey("vendors.id"), nullable=False, index=True),
            sa.Column("document_type", sa.String(100), nullable=False),
            sa.Column("file_name", sa.String(255), nullable=False),
            sa.Column("file_path", sa.String(500), nullable=False),
            sa.Column("uploaded_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        )


def downgrade() -> None:
    op.drop_table("vendor_documents")
    with op.batch_alter_table("vendors") as batch_op:
        for name, _ in NEW_VENDOR_COLUMNS:
            batch_op.drop_column(name)
