# MariaDB setup

`schema.sql` implements the approved five-table ER design. It creates `dbSwollenHippo`, its InnoDB tables, UUID keys, constraints, indexes, and four service rows. No existing tables are dropped. Run once on a new database with an account authorized to create databases and tables:

```sh
sudo mariadb < database/schema.sql
```

Run from the project directory on your Debian server. If your installation uses password authentication instead of local socket authentication, use `mariadb -u YOUR_ADMIN_USER -p < database/schema.sql`. No credentials are included. DDL statements commit independently, so a failed installation can leave partial tables; inspect the error before retrying. Do not use `--force` to ignore errors.

UUIDs use `CHAR(36)` with consistent ASCII, case-insensitive collation on primary and foreign keys. Supply UUIDs from the backend or use MariaDB `UUID()` explicitly in inserts. Checks validate the hyphenated hexadecimal representation; they do not restrict UUID version. CHECK enforcement requires MariaDB 10.2.1 or newer; use a currently supported MariaDB release.

The schema preserves the design assumptions that one email identifies a contact and a canonical organization name identifies an organization. Text uniqueness follows `utf8mb4_unicode_ci` (case/accent insensitive). Trim and normalize incoming values in the backend; spelling aliases are not automatically deduplicated. This schema stores current contact details, not historical snapshots of every submitted name/email.

An inquiry can omit its organization. Deleting a referenced contact, organization, or service is restricted; deleting an inquiry removes only its junction rows. UUID keys cannot be changed while referenced.

The backend must validate email syntax and at least one selected service, reuse existing contacts/organizations, and insert an inquiry and its service selections in a transaction. Foreign keys alone cannot enforce the ER diagram's minimum of one service per inquiry. Set each backend database connection to UTC with `SET time_zone = '+00:00'`. The static contact form has not been connected to this database yet.

## Verification

Four automated static contract tests passed with:

```sh
python3 -m unittest discover -s tests -p test_schema.py -v
```

They check table/key structure, foreign-key declarations, UUID seeds, uniqueness declarations, and absence of destructive setup statements. A MariaDB client/server or Docker was not available in the development environment, so engine execution and constraint behavior have not yet been tested on MariaDB.

MariaDB references: [CREATE TABLE](https://github.com/mariadb-corporation/mariadb-docs/blob/main/server/reference/sql-statements/data-definition/create/create-table.md) and [constraints](https://github.com/mariadb-corporation/mariadb-docs/blob/main/server/reference/sql-statements/data-definition/constraint.md).
