import {
    mysqlTable, int, bigint, varchar, text, decimal,
    datetime, date, boolean, char, json, uniqueIndex, index,
  } from 'drizzle-orm/mysql-core';
  import { sql } from 'drizzle-orm';
  
  export const clients = mysqlTable('clients', {
    id: int('id').autoincrement().primaryKey(),
    name: varchar('name', { length: 150 }).notNull(),
    companyName: varchar('company_name', { length: 200 }),
    email: varchar('email', { length: 150 }),
    phone: varchar('phone', { length: 20 }),
    gstin: varchar('gstin', { length: 20 }),
    address: text('address'),
    kycStatus: varchar('kyc_status', { length: 20 }).notNull().default('pending'),
      // pending | submitted | verified | rejected
    kycVerifiedAt: datetime('kyc_verified_at'),
    kycVerifiedBy: int('kyc_verified_by'),
    status: varchar('status', { length: 20 }).notNull().default('active'),
    createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
  });
  
  export const clientUsers = mysqlTable('client_users', {
    id: int('id').autoincrement().primaryKey(),
    clientId: int('client_id').notNull().references(() => clients.id),
    name: varchar('name', { length: 150 }),
    email: varchar('email', { length: 150 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    lastLoginAt: datetime('last_login_at'),
    lastLoginIp: varchar('last_login_ip', { length: 45 }),
    status: varchar('status', { length: 20 }).notNull().default('active'),
    createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  }, (t) => ({
    emailIdx: uniqueIndex('email_idx').on(t.email),
  }));
  
  export const adminUsers = mysqlTable('admin_users', {
    id: int('id').autoincrement().primaryKey(),
    name: varchar('name', { length: 150 }),
    email: varchar('email', { length: 150 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    role: varchar('role', { length: 30 }).notNull(),
      // super_admin | ops | finance | readonly
    lastLoginAt: datetime('last_login_at'),
    status: varchar('status', { length: 20 }).notNull().default('active'),
    createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  }, (t) => ({
    emailIdx: uniqueIndex('admin_email_idx').on(t.email),
  }));


// ---- KYC documents ----

export const documentTypes = mysqlTable('document_types', {
    id: int('id').autoincrement().primaryKey(),
    code: varchar('code', { length: 50 }).notNull(),
      // pan_card | gst_cert | address_proof | cancelled_cheque | agreement
    name: varchar('name', { length: 100 }).notNull(),
    isMandatory: boolean('is_mandatory').notNull().default(true),
    status: varchar('status', { length: 20 }).default('active'),
  }, (t) => ({
    codeIdx: uniqueIndex('doc_code_idx').on(t.code),
  }));
  
  export const clientDocuments = mysqlTable('client_documents', {
    id: int('id').autoincrement().primaryKey(),
    clientId: int('client_id').notNull().references(() => clients.id),
    docTypeId: int('doc_type_id').notNull().references(() => documentTypes.id),
    filePath: varchar('file_path', { length: 500 }).notNull(),
    fileName: varchar('file_name', { length: 255 }),
    fileSize: int('file_size'),
    mimeType: varchar('mime_type', { length: 100 }),
    docNumber: varchar('doc_number', { length: 100 }),
    uploadedByType: varchar('uploaded_by_type', { length: 10 }).notNull(), // client | admin
    uploadedById: int('uploaded_by_id').notNull(),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
      // pending | verified | rejected
    remarks: text('remarks'),
    reviewedBy: int('reviewed_by').references(() => adminUsers.id),
    reviewedAt: datetime('reviewed_at'),
    createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  }, (t) => ({
    clientStatusIdx: index('client_status_idx').on(t.clientId, t.status),
  }));
  
  // ---- Wallet & funding ----
  
  export const wallets = mysqlTable('wallets', {
    id: int('id').autoincrement().primaryKey(),
    clientId: int('client_id').notNull().references(() => clients.id),
    kind: varchar('kind', { length: 20 }).notNull().default('recharge'),
    balance: decimal('balance', { precision: 15, scale: 2 }).notNull().default('0.00'),
    currency: char('currency', { length: 3 }).notNull().default('INR'),
    createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  }, (t) => ({
    clientKindIdx: uniqueIndex('client_kind_idx').on(t.clientId, t.kind),
  }));
  
  export const walletTransactions = mysqlTable('wallet_transactions', {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    walletId: int('wallet_id').notNull().references(() => wallets.id),
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(), // + credit, - debit
    type: varchar('type', { length: 20 }).notNull(), // topup | debit | refund | adjustment
    reference: varchar('reference', { length: 100 }),
    balanceAfter: decimal('balance_after', { precision: 15, scale: 2 }).notNull(),
    notes: varchar('notes', { length: 255 }),
    createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  }, (t) => ({
    walletCreatedIdx: index('wallet_created_idx').on(t.walletId, t.createdAt),
    referenceIdx: index('reference_idx').on(t.reference),
  }));
  
  export const topupRequests = mysqlTable('topup_requests', {
    id: int('id').autoincrement().primaryKey(),
    walletId: int('wallet_id').notNull().references(() => wallets.id),
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
    bankRef: varchar('bank_ref', { length: 100 }).notNull(),
    transferMode: varchar('transfer_mode', { length: 20 }), // neft | rtgs | imps | cheque
    transferDate: date('transfer_date'),
    proofPath: varchar('proof_path', { length: 500 }),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
      // pending | approved | rejected
    remarks: text('remarks'),
    submittedBy: int('submitted_by'),
    reviewedBy: int('reviewed_by').references(() => adminUsers.id),
    reviewedAt: datetime('reviewed_at'),
    createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  }, (t) => ({
    bankRefIdx: uniqueIndex('bank_ref_idx').on(t.bankRef), // blocks double-claiming
    statusIdx: index('topup_status_idx').on(t.status),
  }));

  export const auditLog = mysqlTable('audit_log', {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    adminId: int('admin_id').references(() => adminUsers.id),
    action: varchar('action', { length: 50 }).notNull(),
      // topup_approved | topup_rejected | kyc_verified | pricing_changed
      // | product_enabled | product_disabled | key_revoked | client_suspended
    entityType: varchar('entity_type', { length: 50 }),
    entityId: varchar('entity_id', { length: 50 }),
    oldValue: json('old_value'),
    newValue: json('new_value'),
    ipAddress: varchar('ip_address', { length: 45 }),
    createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  }, (t) => ({
    entityIdx: index('audit_entity_idx').on(t.entityType, t.entityId),
    createdIdx: index('audit_created_idx').on(t.createdAt),
  }));