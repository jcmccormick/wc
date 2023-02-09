#!/bin/bash

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL

\c sysmaindb

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
	id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	username VARCHAR ( 500 ),
	sub VARCHAR ( 50 ) NOT NULL,
	image VARCHAR ( 250 ),
	first_name VARCHAR ( 500 ),
	last_name VARCHAR ( 500 ),
	email VARCHAR ( 500 ),
	ip_address VARCHAR ( 20 ),
	locked BOOLEAN NOT NULL DEFAULT false,
	created_on TIMESTAMP NOT NULL DEFAULT NOW(),
	created_sub VARCHAR ( 50 ),
	updated_on TIMESTAMP,
	updated_sub VARCHAR ( 50 ),
	enabled BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE groups (
	id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	external_id VARCHAR(255) NOT NULL UNIQUE,
	name VARCHAR ( 50 ) NOT NULL UNIQUE,
	code TEXT NOT NULL,
	created_on TIMESTAMP NOT NULL DEFAULT NOW(),
	created_sub VARCHAR ( 50 ),
	updated_on TIMESTAMP,
	updated_sub VARCHAR ( 50 ),
	enabled BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE uuid_groups (
	id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	parent_uuid uuid NOT NULL,
	group_id uuid NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
	created_on TIMESTAMP NOT NULL DEFAULT NOW(),
	created_sub VARCHAR ( 50 ),
	updated_on TIMESTAMP,
	updated_sub VARCHAR ( 50 ),
	enabled BOOLEAN NOT NULL DEFAULT true,
	UNIQUE (parent_uuid, group_id)
);

CREATE TABLE roles (
	id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	name VARCHAR ( 50 ) NOT NULL UNIQUE,
	created_on TIMESTAMP NOT NULL DEFAULT NOW(),
	created_sub VARCHAR ( 50 ),
	updated_on TIMESTAMP,
	updated_sub VARCHAR ( 50 ),
	enabled BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO
		roles (name)
VALUES
		('admin'),
		('manager'),
		('user');

CREATE TABLE uuid_roles (
	id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	parent_uuid uuid NOT NULL,
	role_id uuid NOT NULL REFERENCES roles (id) ON DELETE CASCADE,
	created_on TIMESTAMP NOT NULL DEFAULT NOW(),
	created_sub VARCHAR ( 50 ),
	updated_on TIMESTAMP,
	updated_sub VARCHAR ( 50 ),
	enabled BOOLEAN NOT NULL DEFAULT true,
	UNIQUE (parent_uuid, role_id)
);

CREATE TABLE file_types (
	id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	name VARCHAR ( 50 ) NOT NULL UNIQUE,
	created_on TIMESTAMP NOT NULL DEFAULT NOW(),
	created_sub VARCHAR ( 50 ),
	updated_on TIMESTAMP,
	updated_sub VARCHAR ( 50 ),
	enabled BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO
	file_types (name)
VALUES
	('images'),
	('documents');

CREATE TABLE files (
	id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	uuid VARCHAR ( 50 ) NOT NULL,
	name VARCHAR ( 50 ),
	file_type_id uuid NOT NULL REFERENCES file_types (id),
	location VARCHAR ( 250 ),
	created_on TIMESTAMP NOT NULL DEFAULT NOW(),
	created_sub VARCHAR ( 50 ),
	updated_on TIMESTAMP,
	updated_sub VARCHAR ( 50 ),
	enabled BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE uuid_files (
	id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	parent_uuid VARCHAR ( 50 ) NOT NULL,
	file_id uuid NOT NULL REFERENCES files (id),
	created_on TIMESTAMP NOT NULL DEFAULT NOW(),
	created_sub VARCHAR ( 50 ),
	updated_on TIMESTAMP,
	updated_sub VARCHAR ( 50 ),
	enabled BOOLEAN NOT NULL DEFAULT true,
	UNIQUE (parent_uuid, file_id)
);

CREATE TABLE uuid_notes (
	id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	parent_uuid VARCHAR ( 50 ) NOT NULL,
	note VARCHAR ( 500 ),
	created_on TIMESTAMP NOT NULL DEFAULT NOW(),
	created_sub VARCHAR ( 50 ),
	updated_on TIMESTAMP,
	updated_sub VARCHAR ( 50 ),
	enabled BOOLEAN NOT NULL DEFAULT true,
	UNIQUE (parent_uuid, note, created_sub)
);

CREATE TABLE request_log (
	id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	sub VARCHAR ( 50 ) NOT NULL,
	path VARCHAR ( 500 ),
	direction VARCHAR ( 10 ),
	code VARCHAR ( 5 ), 
	payload VARCHAR ( 5000 ),
	ip_address VARCHAR ( 50 ) NOT NULL,
	created_on TIMESTAMP NOT NULL DEFAULT NOW(),
	created_sub VARCHAR ( 50 ),
	updated_on TIMESTAMP,
	updated_sub VARCHAR ( 50 ),
	enabled BOOLEAN NOT NULL DEFAULT true
);

EOSQL