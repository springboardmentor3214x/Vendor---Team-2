"""add_procurement_module_tables

Revision ID: ae4e773a9466
Revises: 
Create Date: 2026-07-19 02:39:42.277923

This migration adds all six tables for Module 3 – Procurement Management:
  • procurement_requests
  • procurement_approvals
  • purchase_orders
  • procurement_status_history
  • order_tracking
  • invoices

Existing tables (users, vendors, vendor_documents) are NOT modified.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# ---------------------------------------------------------------------------
revision: str = 'ae4e773a9466'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ------------------------------------------------------------------
    # 1. procurement_requests
    # ------------------------------------------------------------------
    op.create_table(
        'procurement_requests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('request_number', sa.String(length=20), nullable=False),
        sa.Column('request_title', sa.String(length=255), nullable=False),
        sa.Column('department_name', sa.String(length=150), nullable=False),
        sa.Column('requested_by', sa.Integer(), nullable=False),
        sa.Column('item_name', sa.String(length=255), nullable=False),
        sa.Column('product_category', sa.String(length=150), nullable=False),
        sa.Column('quantity', sa.Numeric(precision=12, scale=3), nullable=False),
        sa.Column('unit_of_measurement', sa.String(length=50), nullable=False),
        sa.Column('estimated_budget', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('required_delivery_date', sa.Date(), nullable=False),
        sa.Column(
            'priority',
            sa.Enum('Low', 'Medium', 'High', 'Critical', name='procurementpriority'),
            nullable=False,
        ),
        sa.Column('business_justification', sa.Text(), nullable=False),
        sa.Column('additional_remarks', sa.Text(), nullable=True),
        sa.Column('supporting_document_url', sa.String(length=500), nullable=True),
        sa.Column(
            'status',
            sa.Enum(
                'Pending', 'Approved', 'Ordered', 'Delivered', 'Completed', 'Cancelled',
                name='procurementstatus',
            ),
            nullable=False,
        ),
        sa.Column('assigned_vendor_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['assigned_vendor_id'], ['vendors.id']),
        sa.ForeignKeyConstraint(['requested_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_procurement_requests_id', 'procurement_requests', ['id'])
    op.create_index(
        'ix_procurement_requests_request_number',
        'procurement_requests', ['request_number'], unique=True,
    )

    # ------------------------------------------------------------------
    # 2. procurement_approvals
    # ------------------------------------------------------------------
    op.create_table(
        'procurement_approvals',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('request_id', sa.Integer(), nullable=False),
        sa.Column(
            'approval_status',
            sa.Enum('Approved', 'Rejected', 'Sent Back', name='approvalstatus'),
            nullable=False,
        ),
        sa.Column('approved_by', sa.Integer(), nullable=False),
        sa.Column('approval_date', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['approved_by'], ['users.id']),
        sa.ForeignKeyConstraint(['request_id'], ['procurement_requests.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_procurement_approvals_id', 'procurement_approvals', ['id'])

    # ------------------------------------------------------------------
    # 3. purchase_orders
    # ------------------------------------------------------------------
    op.create_table(
        'purchase_orders',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('po_number', sa.String(length=20), nullable=False),
        sa.Column('request_id', sa.Integer(), nullable=False),
        sa.Column('vendor_id', sa.Integer(), nullable=False),
        sa.Column('product_details', sa.Text(), nullable=False),
        sa.Column('quantity_ordered', sa.Numeric(precision=12, scale=3), nullable=False),
        sa.Column('unit_price', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('total_cost', sa.Numeric(precision=17, scale=2), nullable=False),
        sa.Column('tax_details', sa.Text(), nullable=True),
        sa.Column('shipping_address', sa.Text(), nullable=True),
        sa.Column('expected_delivery_date', sa.Date(), nullable=True),
        sa.Column('payment_terms', sa.String(length=100), nullable=True),
        sa.Column('po_status', sa.String(length=50), nullable=False),
        sa.Column('approved_by', sa.Integer(), nullable=True),
        sa.Column('po_date', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['approved_by'], ['users.id']),
        sa.ForeignKeyConstraint(['request_id'], ['procurement_requests.id']),
        sa.ForeignKeyConstraint(['vendor_id'], ['vendors.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('request_id'),
    )
    op.create_index('ix_purchase_orders_id', 'purchase_orders', ['id'])
    op.create_index('ix_purchase_orders_po_number', 'purchase_orders', ['po_number'], unique=True)

    # ------------------------------------------------------------------
    # 4. procurement_status_history
    # ------------------------------------------------------------------
    op.create_table(
        'procurement_status_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('request_id', sa.Integer(), nullable=False),
        sa.Column('old_status', sa.String(length=50), nullable=True),
        sa.Column('new_status', sa.String(length=50), nullable=False),
        sa.Column('changed_by', sa.Integer(), nullable=False),
        sa.Column('changed_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['changed_by'], ['users.id']),
        sa.ForeignKeyConstraint(['request_id'], ['procurement_requests.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_procurement_status_history_id', 'procurement_status_history', ['id'])

    # ------------------------------------------------------------------
    # 5. order_tracking
    # ------------------------------------------------------------------
    op.create_table(
        'order_tracking',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('po_id', sa.Integer(), nullable=False),
        sa.Column('dispatch_date', sa.Date(), nullable=True),
        sa.Column('expected_delivery_date', sa.Date(), nullable=True),
        sa.Column('actual_delivery_date', sa.Date(), nullable=True),
        sa.Column(
            'delivery_status',
            sa.Enum(
                'Awaiting Shipment', 'In Transit', 'Delivered', 'Delayed', 'Completed',
                name='deliverystatus',
            ),
            nullable=False,
        ),
        sa.Column('delay_days', sa.Integer(), nullable=True),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['po_id'], ['purchase_orders.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('po_id'),
    )
    op.create_index('ix_order_tracking_id', 'order_tracking', ['id'])

    # ------------------------------------------------------------------
    # 6. invoices
    # ------------------------------------------------------------------
    op.create_table(
        'invoices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('invoice_number', sa.String(length=50), nullable=False),
        sa.Column('po_id', sa.Integer(), nullable=False),
        sa.Column('vendor_id', sa.Integer(), nullable=False),
        sa.Column('invoice_date', sa.Date(), nullable=False),
        sa.Column('invoice_amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('tax_amount', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('total_amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column(
            'payment_status',
            sa.Enum('Pending', 'Verified', 'Approved', 'Paid', 'Rejected', name='paymentstatus'),
            nullable=False,
        ),
        sa.Column('invoice_document_url', sa.String(length=500), nullable=True),
        sa.Column('verified_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['po_id'], ['purchase_orders.id']),
        sa.ForeignKeyConstraint(['vendor_id'], ['vendors.id']),
        sa.ForeignKeyConstraint(['verified_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_invoices_id', 'invoices', ['id'])
    op.create_index('ix_invoices_invoice_number', 'invoices', ['invoice_number'], unique=True)


def downgrade() -> None:
    op.drop_table('invoices')
    op.drop_table('order_tracking')
    op.drop_table('procurement_status_history')
    op.drop_table('purchase_orders')
    op.drop_table('procurement_approvals')
    op.drop_table('procurement_requests')
