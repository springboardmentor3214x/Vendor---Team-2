--
-- PostgreSQL database dump
--

\restrict GjqMeIsIonvspq4kga6eoeCw5LK4HkgfrifUMsFVJkWcKG6s8t3gSCAgxYfFvtQ

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_logs (
    log_id integer NOT NULL,
    user_id integer,
    activity character varying(300) NOT NULL,
    ip_address character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.activity_logs OWNER TO postgres;

--
-- Name: activity_logs_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.activity_logs_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activity_logs_log_id_seq OWNER TO postgres;

--
-- Name: activity_logs_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.activity_logs_log_id_seq OWNED BY public.activity_logs.log_id;


--
-- Name: communications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.communications (
    communication_id integer NOT NULL,
    sender_id integer,
    vendor_id integer,
    subject character varying(200) NOT NULL,
    message text NOT NULL,
    communication_type character varying(30),
    sent_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT communications_communication_type_check CHECK (((communication_type)::text = ANY ((ARRAY['Email'::character varying, 'SMS'::character varying, 'Meeting'::character varying, 'Call'::character varying])::text[])))
);


ALTER TABLE public.communications OWNER TO postgres;

--
-- Name: communications_communication_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.communications_communication_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.communications_communication_id_seq OWNER TO postgres;

--
-- Name: communications_communication_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.communications_communication_id_seq OWNED BY public.communications.communication_id;


--
-- Name: compliance_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.compliance_records (
    compliance_id integer NOT NULL,
    contract_id integer,
    vendor_id integer,
    compliance_status character varying(20),
    remarks text,
    checked_by integer,
    checked_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT compliance_records_compliance_status_check CHECK (((compliance_status)::text = ANY ((ARRAY['Compliant'::character varying, 'Non-Compliant'::character varying, 'Pending'::character varying])::text[])))
);


ALTER TABLE public.compliance_records OWNER TO postgres;

--
-- Name: compliance_records_compliance_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.compliance_records_compliance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.compliance_records_compliance_id_seq OWNER TO postgres;

--
-- Name: compliance_records_compliance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.compliance_records_compliance_id_seq OWNED BY public.compliance_records.compliance_id;


--
-- Name: contracts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contracts (
    contract_id integer NOT NULL,
    vendor_id integer NOT NULL,
    contract_name character varying(200) NOT NULL,
    contract_number character varying(100) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    contract_value numeric(12,2),
    compliance_status character varying(20) DEFAULT 'Compliant'::character varying,
    renewal_required boolean DEFAULT false,
    renewal_date date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT contracts_compliance_status_check CHECK (((compliance_status)::text = ANY ((ARRAY['Compliant'::character varying, 'Non-Compliant'::character varying, 'Pending'::character varying])::text[])))
);


ALTER TABLE public.contracts OWNER TO postgres;

--
-- Name: contracts_contract_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.contracts_contract_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contracts_contract_id_seq OWNER TO postgres;

--
-- Name: contracts_contract_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contracts_contract_id_seq OWNED BY public.contracts.contract_id;


--
-- Name: dashboard_metrics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dashboard_metrics (
    metric_id integer NOT NULL,
    metric_name character varying(100),
    metric_value numeric(15,2),
    last_updated timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.dashboard_metrics OWNER TO postgres;

--
-- Name: dashboard_metrics_metric_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dashboard_metrics_metric_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dashboard_metrics_metric_id_seq OWNER TO postgres;

--
-- Name: dashboard_metrics_metric_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dashboard_metrics_metric_id_seq OWNED BY public.dashboard_metrics.metric_id;


--
-- Name: email_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_logs (
    email_id integer NOT NULL,
    recipient_email character varying(150),
    subject character varying(200),
    status character varying(20),
    sent_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.email_logs OWNER TO postgres;

--
-- Name: email_logs_email_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.email_logs_email_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.email_logs_email_id_seq OWNER TO postgres;

--
-- Name: email_logs_email_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.email_logs_email_id_seq OWNED BY public.email_logs.email_id;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoices (
    invoice_id integer NOT NULL,
    po_id integer,
    vendor_id integer,
    invoice_number character varying(100),
    invoice_date date,
    due_date date,
    amount numeric(12,2),
    payment_status character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT invoices_payment_status_check CHECK (((payment_status)::text = ANY ((ARRAY['Pending'::character varying, 'Paid'::character varying, 'Overdue'::character varying])::text[])))
);


ALTER TABLE public.invoices OWNER TO postgres;

--
-- Name: invoices_invoice_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.invoices_invoice_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoices_invoice_id_seq OWNER TO postgres;

--
-- Name: invoices_invoice_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.invoices_invoice_id_seq OWNED BY public.invoices.invoice_id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    notification_id integer NOT NULL,
    user_id integer,
    title character varying(200) NOT NULL,
    message text NOT NULL,
    notification_type character varying(30),
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT notifications_notification_type_check CHECK (((notification_type)::text = ANY ((ARRAY['Email'::character varying, 'SMS'::character varying, 'System'::character varying])::text[])))
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_notification_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_notification_id_seq OWNER TO postgres;

--
-- Name: notifications_notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_notification_id_seq OWNED BY public.notifications.notification_id;


--
-- Name: procurement_discussions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.procurement_discussions (
    discussion_id integer NOT NULL,
    procurement_id integer,
    user_id integer,
    message text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.procurement_discussions OWNER TO postgres;

--
-- Name: procurement_discussions_discussion_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.procurement_discussions_discussion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.procurement_discussions_discussion_id_seq OWNER TO postgres;

--
-- Name: procurement_discussions_discussion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.procurement_discussions_discussion_id_seq OWNED BY public.procurement_discussions.discussion_id;


--
-- Name: procurement_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.procurement_requests (
    request_id integer NOT NULL,
    request_title character varying(200) NOT NULL,
    description text,
    requested_by integer,
    vendor_id integer,
    department character varying(100),
    estimated_cost numeric(12,2),
    priority character varying(20) DEFAULT 'Medium'::character varying,
    status character varying(20) DEFAULT 'Pending'::character varying,
    request_date date DEFAULT CURRENT_DATE,
    approval_date date,
    remarks text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT procurement_requests_priority_check CHECK (((priority)::text = ANY ((ARRAY['Low'::character varying, 'Medium'::character varying, 'High'::character varying, 'Critical'::character varying])::text[]))),
    CONSTRAINT procurement_requests_status_check CHECK (((status)::text = ANY ((ARRAY['Pending'::character varying, 'Approved'::character varying, 'Ordered'::character varying, 'Delivered'::character varying, 'Completed'::character varying, 'Cancelled'::character varying])::text[])))
);


ALTER TABLE public.procurement_requests OWNER TO postgres;

--
-- Name: procurement_requests_request_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.procurement_requests_request_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.procurement_requests_request_id_seq OWNER TO postgres;

--
-- Name: procurement_requests_request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.procurement_requests_request_id_seq OWNED BY public.procurement_requests.request_id;


--
-- Name: purchase_order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_order_items (
    item_id integer NOT NULL,
    po_id integer,
    item_name character varying(200) NOT NULL,
    description text,
    quantity integer NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    total_price numeric(12,2) GENERATED ALWAYS AS (((quantity)::numeric * unit_price)) STORED
);


ALTER TABLE public.purchase_order_items OWNER TO postgres;

--
-- Name: purchase_order_items_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.purchase_order_items_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchase_order_items_item_id_seq OWNER TO postgres;

--
-- Name: purchase_order_items_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.purchase_order_items_item_id_seq OWNED BY public.purchase_order_items.item_id;


--
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_orders (
    po_id integer NOT NULL,
    procurement_id integer,
    vendor_id integer,
    po_number character varying(50) NOT NULL,
    total_amount numeric(12,2) NOT NULL,
    order_date date NOT NULL,
    expected_delivery date,
    actual_delivery date,
    payment_status character varying(20) DEFAULT 'Pending'::character varying,
    status character varying(20) DEFAULT 'Ordered'::character varying,
    invoice_number character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT purchase_orders_payment_status_check CHECK (((payment_status)::text = ANY ((ARRAY['Pending'::character varying, 'Partial'::character varying, 'Paid'::character varying])::text[]))),
    CONSTRAINT purchase_orders_status_check CHECK (((status)::text = ANY ((ARRAY['Ordered'::character varying, 'Shipped'::character varying, 'Delivered'::character varying, 'Cancelled'::character varying])::text[])))
);


ALTER TABLE public.purchase_orders OWNER TO postgres;

--
-- Name: purchase_orders_po_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.purchase_orders_po_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchase_orders_po_id_seq OWNER TO postgres;

--
-- Name: purchase_orders_po_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.purchase_orders_po_id_seq OWNED BY public.purchase_orders.po_id;


--
-- Name: reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reports (
    report_id integer NOT NULL,
    report_name character varying(200) NOT NULL,
    report_type character varying(100),
    generated_by integer,
    file_path text,
    generated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.reports OWNER TO postgres;

--
-- Name: reports_report_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reports_report_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reports_report_id_seq OWNER TO postgres;

--
-- Name: reports_report_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reports_report_id_seq OWNED BY public.reports.report_id;


--
-- Name: sms_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sms_logs (
    sms_id integer NOT NULL,
    phone_number character varying(20),
    message text,
    status character varying(20),
    sent_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.sms_logs OWNER TO postgres;

--
-- Name: sms_logs_sms_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sms_logs_sms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sms_logs_sms_id_seq OWNER TO postgres;

--
-- Name: sms_logs_sms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sms_logs_sms_id_seq OWNED BY public.sms_logs.sms_id;


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_settings (
    setting_id integer NOT NULL,
    setting_name character varying(100),
    setting_value text,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.system_settings OWNER TO postgres;

--
-- Name: system_settings_setting_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.system_settings_setting_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_settings_setting_id_seq OWNER TO postgres;

--
-- Name: system_settings_setting_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.system_settings_setting_id_seq OWNED BY public.system_settings.setting_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    full_name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash text NOT NULL,
    phone character varying(20),
    role character varying(30) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['Administrator'::character varying, 'Procurement Manager'::character varying, 'Supply Chain Manager'::character varying, 'Vendor'::character varying, 'Finance Officer'::character varying, 'Auditor'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: vendor_approvals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vendor_approvals (
    approval_id integer NOT NULL,
    vendor_id integer,
    approved_by integer,
    approval_status character varying(20),
    remarks text,
    approval_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT vendor_approvals_approval_status_check CHECK (((approval_status)::text = ANY ((ARRAY['Pending'::character varying, 'Approved'::character varying, 'Rejected'::character varying])::text[])))
);


ALTER TABLE public.vendor_approvals OWNER TO postgres;

--
-- Name: vendor_approvals_approval_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vendor_approvals_approval_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vendor_approvals_approval_id_seq OWNER TO postgres;

--
-- Name: vendor_approvals_approval_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vendor_approvals_approval_id_seq OWNED BY public.vendor_approvals.approval_id;


--
-- Name: vendor_certifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vendor_certifications (
    certification_id integer NOT NULL,
    vendor_id integer,
    certification_name character varying(200),
    issued_by character varying(200),
    issue_date date,
    expiry_date date,
    certificate_file text
);


ALTER TABLE public.vendor_certifications OWNER TO postgres;

--
-- Name: vendor_certifications_certification_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vendor_certifications_certification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vendor_certifications_certification_id_seq OWNER TO postgres;

--
-- Name: vendor_certifications_certification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vendor_certifications_certification_id_seq OWNED BY public.vendor_certifications.certification_id;


--
-- Name: vendor_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vendor_documents (
    document_id integer NOT NULL,
    vendor_id integer,
    document_name character varying(200),
    document_type character varying(100),
    file_path text,
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.vendor_documents OWNER TO postgres;

--
-- Name: vendor_documents_document_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vendor_documents_document_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vendor_documents_document_id_seq OWNER TO postgres;

--
-- Name: vendor_documents_document_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vendor_documents_document_id_seq OWNED BY public.vendor_documents.document_id;


--
-- Name: vendor_performance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vendor_performance (
    performance_id integer NOT NULL,
    vendor_id integer NOT NULL,
    po_id integer,
    on_time_deliveries integer DEFAULT 0,
    delayed_deliveries integer DEFAULT 0,
    quality_rating numeric(3,2),
    communication_rating numeric(3,2),
    service_rating numeric(3,2),
    response_time_hours numeric(6,2),
    issue_resolution_days integer,
    order_completion_rate numeric(5,2),
    remarks text,
    evaluation_date date DEFAULT CURRENT_DATE,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT vendor_performance_communication_rating_check CHECK (((communication_rating >= (0)::numeric) AND (communication_rating <= (5)::numeric))),
    CONSTRAINT vendor_performance_quality_rating_check CHECK (((quality_rating >= (0)::numeric) AND (quality_rating <= (5)::numeric))),
    CONSTRAINT vendor_performance_service_rating_check CHECK (((service_rating >= (0)::numeric) AND (service_rating <= (5)::numeric)))
);


ALTER TABLE public.vendor_performance OWNER TO postgres;

--
-- Name: vendor_performance_performance_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vendor_performance_performance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vendor_performance_performance_id_seq OWNER TO postgres;

--
-- Name: vendor_performance_performance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vendor_performance_performance_id_seq OWNED BY public.vendor_performance.performance_id;


--
-- Name: vendor_reliability; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vendor_reliability (
    reliability_id integer NOT NULL,
    vendor_id integer,
    delivery_history_score numeric(5,2),
    product_quality_score numeric(5,2),
    communication_score numeric(5,2),
    contract_compliance_score numeric(5,2),
    purchase_history_score numeric(5,2),
    issue_resolution_score numeric(5,2),
    reliability_score numeric(5,2),
    risk_level character varying(20),
    recommendation text,
    last_updated timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT vendor_reliability_risk_level_check CHECK (((risk_level)::text = ANY ((ARRAY['Low'::character varying, 'Medium'::character varying, 'High'::character varying])::text[])))
);


ALTER TABLE public.vendor_reliability OWNER TO postgres;

--
-- Name: vendor_reliability_reliability_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vendor_reliability_reliability_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vendor_reliability_reliability_id_seq OWNER TO postgres;

--
-- Name: vendor_reliability_reliability_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vendor_reliability_reliability_id_seq OWNED BY public.vendor_reliability.reliability_id;


--
-- Name: vendors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vendors (
    vendor_id integer NOT NULL,
    vendor_name character varying(150) NOT NULL,
    company_name character varying(150),
    category character varying(50) NOT NULL,
    contact_person character varying(100),
    email character varying(100),
    phone character varying(20),
    address text,
    city character varying(100),
    state character varying(100),
    country character varying(100),
    postal_code character varying(20),
    gst_number character varying(50),
    registration_number character varying(50),
    approval_status character varying(20) DEFAULT 'Pending'::character varying,
    vendor_status character varying(20) DEFAULT 'Active'::character varying,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT vendors_approval_status_check CHECK (((approval_status)::text = ANY ((ARRAY['Pending'::character varying, 'Approved'::character varying, 'Rejected'::character varying])::text[]))),
    CONSTRAINT vendors_category_check CHECK (((category)::text = ANY ((ARRAY['Raw Material Suppliers'::character varying, 'Equipment Vendors'::character varying, 'IT Vendors'::character varying, 'Service Providers'::character varying, 'Logistics Partners'::character varying, 'Maintenance Vendors'::character varying])::text[]))),
    CONSTRAINT vendors_vendor_status_check CHECK (((vendor_status)::text = ANY ((ARRAY['Active'::character varying, 'Inactive'::character varying, 'Suspended'::character varying])::text[])))
);


ALTER TABLE public.vendors OWNER TO postgres;

--
-- Name: vendors_vendor_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vendors_vendor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vendors_vendor_id_seq OWNER TO postgres;

--
-- Name: vendors_vendor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vendors_vendor_id_seq OWNED BY public.vendors.vendor_id;


--
-- Name: activity_logs log_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN log_id SET DEFAULT nextval('public.activity_logs_log_id_seq'::regclass);


--
-- Name: communications communication_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communications ALTER COLUMN communication_id SET DEFAULT nextval('public.communications_communication_id_seq'::regclass);


--
-- Name: compliance_records compliance_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compliance_records ALTER COLUMN compliance_id SET DEFAULT nextval('public.compliance_records_compliance_id_seq'::regclass);


--
-- Name: contracts contract_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts ALTER COLUMN contract_id SET DEFAULT nextval('public.contracts_contract_id_seq'::regclass);


--
-- Name: dashboard_metrics metric_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dashboard_metrics ALTER COLUMN metric_id SET DEFAULT nextval('public.dashboard_metrics_metric_id_seq'::regclass);


--
-- Name: email_logs email_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_logs ALTER COLUMN email_id SET DEFAULT nextval('public.email_logs_email_id_seq'::regclass);


--
-- Name: invoices invoice_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices ALTER COLUMN invoice_id SET DEFAULT nextval('public.invoices_invoice_id_seq'::regclass);


--
-- Name: notifications notification_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN notification_id SET DEFAULT nextval('public.notifications_notification_id_seq'::regclass);


--
-- Name: procurement_discussions discussion_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.procurement_discussions ALTER COLUMN discussion_id SET DEFAULT nextval('public.procurement_discussions_discussion_id_seq'::regclass);


--
-- Name: procurement_requests request_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.procurement_requests ALTER COLUMN request_id SET DEFAULT nextval('public.procurement_requests_request_id_seq'::regclass);


--
-- Name: purchase_order_items item_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order_items ALTER COLUMN item_id SET DEFAULT nextval('public.purchase_order_items_item_id_seq'::regclass);


--
-- Name: purchase_orders po_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders ALTER COLUMN po_id SET DEFAULT nextval('public.purchase_orders_po_id_seq'::regclass);


--
-- Name: reports report_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports ALTER COLUMN report_id SET DEFAULT nextval('public.reports_report_id_seq'::regclass);


--
-- Name: sms_logs sms_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sms_logs ALTER COLUMN sms_id SET DEFAULT nextval('public.sms_logs_sms_id_seq'::regclass);


--
-- Name: system_settings setting_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings ALTER COLUMN setting_id SET DEFAULT nextval('public.system_settings_setting_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Name: vendor_approvals approval_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_approvals ALTER COLUMN approval_id SET DEFAULT nextval('public.vendor_approvals_approval_id_seq'::regclass);


--
-- Name: vendor_certifications certification_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_certifications ALTER COLUMN certification_id SET DEFAULT nextval('public.vendor_certifications_certification_id_seq'::regclass);


--
-- Name: vendor_documents document_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_documents ALTER COLUMN document_id SET DEFAULT nextval('public.vendor_documents_document_id_seq'::regclass);


--
-- Name: vendor_performance performance_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_performance ALTER COLUMN performance_id SET DEFAULT nextval('public.vendor_performance_performance_id_seq'::regclass);


--
-- Name: vendor_reliability reliability_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_reliability ALTER COLUMN reliability_id SET DEFAULT nextval('public.vendor_reliability_reliability_id_seq'::regclass);


--
-- Name: vendors vendor_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors ALTER COLUMN vendor_id SET DEFAULT nextval('public.vendors_vendor_id_seq'::regclass);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (log_id);


--
-- Name: communications communications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communications
    ADD CONSTRAINT communications_pkey PRIMARY KEY (communication_id);


--
-- Name: compliance_records compliance_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compliance_records
    ADD CONSTRAINT compliance_records_pkey PRIMARY KEY (compliance_id);


--
-- Name: contracts contracts_contract_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_contract_number_key UNIQUE (contract_number);


--
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (contract_id);


--
-- Name: dashboard_metrics dashboard_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dashboard_metrics
    ADD CONSTRAINT dashboard_metrics_pkey PRIMARY KEY (metric_id);


--
-- Name: email_logs email_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT email_logs_pkey PRIMARY KEY (email_id);


--
-- Name: invoices invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (invoice_id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (notification_id);


--
-- Name: procurement_discussions procurement_discussions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.procurement_discussions
    ADD CONSTRAINT procurement_discussions_pkey PRIMARY KEY (discussion_id);


--
-- Name: procurement_requests procurement_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.procurement_requests
    ADD CONSTRAINT procurement_requests_pkey PRIMARY KEY (request_id);


--
-- Name: purchase_order_items purchase_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_pkey PRIMARY KEY (item_id);


--
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (po_id);


--
-- Name: purchase_orders purchase_orders_po_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_po_number_key UNIQUE (po_number);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (report_id);


--
-- Name: sms_logs sms_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sms_logs
    ADD CONSTRAINT sms_logs_pkey PRIMARY KEY (sms_id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (setting_id);


--
-- Name: system_settings system_settings_setting_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_setting_name_key UNIQUE (setting_name);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: vendor_approvals vendor_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_approvals
    ADD CONSTRAINT vendor_approvals_pkey PRIMARY KEY (approval_id);


--
-- Name: vendor_certifications vendor_certifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_certifications
    ADD CONSTRAINT vendor_certifications_pkey PRIMARY KEY (certification_id);


--
-- Name: vendor_documents vendor_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_documents
    ADD CONSTRAINT vendor_documents_pkey PRIMARY KEY (document_id);


--
-- Name: vendor_performance vendor_performance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_performance
    ADD CONSTRAINT vendor_performance_pkey PRIMARY KEY (performance_id);


--
-- Name: vendor_reliability vendor_reliability_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_reliability
    ADD CONSTRAINT vendor_reliability_pkey PRIMARY KEY (reliability_id);


--
-- Name: vendor_reliability vendor_reliability_vendor_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_reliability
    ADD CONSTRAINT vendor_reliability_vendor_id_key UNIQUE (vendor_id);


--
-- Name: vendors vendors_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_email_key UNIQUE (email);


--
-- Name: vendors vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_pkey PRIMARY KEY (vendor_id);


--
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: communications communications_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communications
    ADD CONSTRAINT communications_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: communications communications_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communications
    ADD CONSTRAINT communications_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(vendor_id) ON DELETE SET NULL;


--
-- Name: compliance_records compliance_records_checked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compliance_records
    ADD CONSTRAINT compliance_records_checked_by_fkey FOREIGN KEY (checked_by) REFERENCES public.users(user_id);


--
-- Name: compliance_records compliance_records_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compliance_records
    ADD CONSTRAINT compliance_records_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(contract_id);


--
-- Name: compliance_records compliance_records_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compliance_records
    ADD CONSTRAINT compliance_records_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(vendor_id);


--
-- Name: contracts contracts_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(vendor_id) ON DELETE CASCADE;


--
-- Name: invoices invoices_po_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_orders(po_id);


--
-- Name: invoices invoices_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(vendor_id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: procurement_discussions procurement_discussions_procurement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.procurement_discussions
    ADD CONSTRAINT procurement_discussions_procurement_id_fkey FOREIGN KEY (procurement_id) REFERENCES public.procurement_requests(request_id);


--
-- Name: procurement_discussions procurement_discussions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.procurement_discussions
    ADD CONSTRAINT procurement_discussions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: procurement_requests procurement_requests_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.procurement_requests
    ADD CONSTRAINT procurement_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: procurement_requests procurement_requests_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.procurement_requests
    ADD CONSTRAINT procurement_requests_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(vendor_id) ON DELETE SET NULL;


--
-- Name: purchase_order_items purchase_order_items_po_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_orders(po_id) ON DELETE CASCADE;


--
-- Name: purchase_orders purchase_orders_procurement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_procurement_id_fkey FOREIGN KEY (procurement_id) REFERENCES public.procurement_requests(request_id) ON DELETE CASCADE;


--
-- Name: purchase_orders purchase_orders_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(vendor_id) ON DELETE CASCADE;


--
-- Name: reports reports_generated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_generated_by_fkey FOREIGN KEY (generated_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: vendor_approvals vendor_approvals_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_approvals
    ADD CONSTRAINT vendor_approvals_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(user_id);


--
-- Name: vendor_approvals vendor_approvals_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_approvals
    ADD CONSTRAINT vendor_approvals_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(vendor_id);


--
-- Name: vendor_certifications vendor_certifications_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_certifications
    ADD CONSTRAINT vendor_certifications_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(vendor_id);


--
-- Name: vendor_documents vendor_documents_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_documents
    ADD CONSTRAINT vendor_documents_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(vendor_id) ON DELETE CASCADE;


--
-- Name: vendor_performance vendor_performance_po_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_performance
    ADD CONSTRAINT vendor_performance_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_orders(po_id) ON DELETE SET NULL;


--
-- Name: vendor_performance vendor_performance_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_performance
    ADD CONSTRAINT vendor_performance_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(vendor_id) ON DELETE CASCADE;


--
-- Name: vendor_reliability vendor_reliability_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_reliability
    ADD CONSTRAINT vendor_reliability_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(vendor_id) ON DELETE CASCADE;


--
-- Name: vendors vendors_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict GjqMeIsIonvspq4kga6eoeCw5LK4HkgfrifUMsFVJkWcKG6s8t3gSCAgxYfFvtQ

