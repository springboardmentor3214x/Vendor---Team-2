"""add status_history table (procurement request + PO audit trail)

Revision ID: 0004_status_history
Revises: 0003_po_ext
Create Date: 2026-08-19
"""
from alembic import op
import sqlalchemy as sa


revision = "0004_status_history"
down_revision = "0003_po_ext"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "status_history" in inspector.get_table_names():
        return
    op.create_table(
        "status_history",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("entity_type", sa.String(30), nullable=False),
        sa.Column("entity_id", sa.String(36), nullable=False, index=True),
        sa.Column("old_status", sa.String(30), nullable=True),
        sa.Column("new_status", sa.String(30), nullable=False),
        sa.Column("changed_by", sa.String(36), nullable=True),
        sa.Column("remarks", sa.String(500), nullable=True),
        sa.Column("changed_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("status_history")
