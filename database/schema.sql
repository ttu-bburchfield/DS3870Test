-- SwollenHippo Industries: MariaDB 10.2.1+ (enforced CHECK constraints).
-- Run once against a new database; existing tables deliberately cause an error.
-- UUIDs are supplied by the backend (or explicitly with MariaDB UUID()).
-- CHAR(36) avoids requiring MariaDB's newer native UUID type.
CREATE DATABASE IF NOT EXISTS dbSwollenHippo
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dbSwollenHippo;

CREATE TABLE tblContact (
    contact_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(254) NOT NULL,
    CONSTRAINT pk_tblContact PRIMARY KEY (contact_id),
    CONSTRAINT uq_tblContact_email UNIQUE (email),
    CONSTRAINT ck_tblContact_uuid CHECK (
        contact_id REGEXP '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    ),
    CONSTRAINT ck_tblContact_name CHECK (CHAR_LENGTH(TRIM(full_name)) > 0),
    CONSTRAINT ck_tblContact_email CHECK (CHAR_LENGTH(TRIM(email)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tblOrganization (
    organization_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    organization_name VARCHAR(160) NOT NULL,
    CONSTRAINT pk_tblOrganization PRIMARY KEY (organization_id),
    CONSTRAINT uq_tblOrganization_name UNIQUE (organization_name),
    CONSTRAINT ck_tblOrganization_uuid CHECK (
        organization_id REGEXP '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    ),
    CONSTRAINT ck_tblOrganization_name CHECK (CHAR_LENGTH(TRIM(organization_name)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tblService (
    service_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    service_name VARCHAR(120) NOT NULL,
    CONSTRAINT pk_tblService PRIMARY KEY (service_id),
    CONSTRAINT uq_tblService_name UNIQUE (service_name),
    CONSTRAINT ck_tblService_uuid CHECK (
        service_id REGEXP '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    ),
    CONSTRAINT ck_tblService_name CHECK (CHAR_LENGTH(TRIM(service_name)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tblInquiry (
    inquiry_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    contact_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    organization_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NULL,
    project_details TEXT NOT NULL,
    -- Set the backend connection time_zone to '+00:00' to store UTC consistently.
    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_tblInquiry PRIMARY KEY (inquiry_id),
    KEY ix_tblInquiry_contact (contact_id),
    KEY ix_tblInquiry_organization (organization_id),
    CONSTRAINT ck_tblInquiry_uuid CHECK (
        inquiry_id REGEXP '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    ),
    CONSTRAINT ck_tblInquiry_details CHECK (CHAR_LENGTH(TRIM(project_details)) BETWEEN 1 AND 5000),
    CONSTRAINT fk_tblInquiry_contact FOREIGN KEY (contact_id)
        REFERENCES tblContact (contact_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_tblInquiry_organization FOREIGN KEY (organization_id)
        REFERENCES tblOrganization (organization_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tblInquiryService (
    inquiry_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    service_id CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    -- The UUID pair is the key: a service cannot be repeated within an inquiry.
    CONSTRAINT pk_tblInquiryService PRIMARY KEY (inquiry_id, service_id),
    KEY ix_tblInquiryService_service (service_id),
    CONSTRAINT fk_tblInquiryService_inquiry FOREIGN KEY (inquiry_id)
        REFERENCES tblInquiry (inquiry_id) ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_tblInquiryService_service FOREIGN KEY (service_id)
        REFERENCES tblService (service_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stable UUIDs allow the backend to map the four existing form choices.
INSERT INTO tblService (service_id, service_name) VALUES
    ('60bce1f6-31ed-42ea-83ac-56925e654451', 'Additive & Subtractive Manufacturing'),
    ('d73113a1-dda3-47ec-8c74-9c62cb292650', 'Electronics Design & Development'),
    ('87551615-f021-4673-a267-e06b408677c5', 'Software Development'),
    ('dc65dd64-c010-4e31-a85b-5bfefbf399ab', 'Digital & Industrial Design');

-- A foreign key cannot require a parent inquiry to have at least one child.
-- The backend must validate one or more services and insert the inquiry and
-- all tblInquiryService rows in one transaction, rolling back on any failure.
