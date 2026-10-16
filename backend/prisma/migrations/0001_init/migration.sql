-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."dewey_classification_status" AS ENUM ('in_use', 'unassigned', 'discontinued');

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "module" VARCHAR(50) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "entity_id" VARCHAR(100),
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."book_copies" (
    "copy_id" SERIAL NOT NULL,
    "book_id" INTEGER NOT NULL,
    "inventory_number" VARCHAR(50) NOT NULL,
    "isavailable" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6),

    CONSTRAINT "book_copies_pkey" PRIMARY KEY ("copy_id")
);

-- CreateTable
CREATE TABLE "public"."books" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "isbn" TEXT NOT NULL,
    "description" VARCHAR(255),
    "publisher" VARCHAR(100),
    "topographic_subject" VARCHAR(10),
    "dewey_category_id" VARCHAR(3),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "edition_date" DATE,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."books_keywords" (
    "book_id" BIGINT NOT NULL,
    "keyword_id" BIGINT NOT NULL,

    CONSTRAINT "books_keywords_pkey" PRIMARY KEY ("book_id","keyword_id")
);

-- CreateTable
CREATE TABLE "public"."borrower_status_history" (
    "id" SERIAL NOT NULL,
    "borrower_id" BIGINT NOT NULL,
    "action" VARCHAR(20) NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID NOT NULL,

    CONSTRAINT "borrower_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."borrowers" (
    "id" BIGSERIAL NOT NULL,
    "dni" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" VARCHAR(100),
    "created_at" TIMESTAMP(6),
    "last_name" TEXT,
    "status" VARCHAR(10) DEFAULT 'enabled',
    "gender" VARCHAR(10),

    CONSTRAINT "borrowers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dewey_classifications" (
    "code" VARCHAR(3) NOT NULL,
    "status" "public"."dewey_classification_status",

    CONSTRAINT "dewey_classifications_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "public"."dewey_classifications_translations" (
    "id" BIGSERIAL NOT NULL,
    "dewey_classification_id" VARCHAR(3) NOT NULL,
    "lang_code" VARCHAR(5) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "dewey_classifications_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."faq_translations" (
    "faq_id" UUID NOT NULL,
    "language_code" VARCHAR(5) NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,

    CONSTRAINT "faq_translations_pkey" PRIMARY KEY ("faq_id","language_code")
);

-- CreateTable
CREATE TABLE "public"."faqs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category" VARCHAR(50),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."keywords" (
    "id" BIGSERIAL NOT NULL,
    "keyword" TEXT NOT NULL,

    CONSTRAINT "keywords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."languages" (
    "code" VARCHAR(5) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN DEFAULT true,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "public"."library_profile" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "library_name" VARCHAR(150) NOT NULL,
    "primary_email" VARCHAR(100),
    "phone_number" VARCHAR(30),
    "address" TEXT,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "library_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."loans" (
    "id" BIGSERIAL NOT NULL,
    "borrower_id" BIGINT,
    "loan_date" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMP(6),
    "description" VARCHAR(255),
    "type" VARCHAR(20),
    "user_id" UUID NOT NULL,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."loans_copies" (
    "id" BIGSERIAL NOT NULL,
    "loan_id" BIGINT,
    "copy_id" INTEGER,
    "returned" BOOLEAN DEFAULT false,
    "return_date" TIMESTAMP(6),

    CONSTRAINT "loans_copies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."modules" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."permissions" (
    "id" BIGSERIAL NOT NULL,
    "module_id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."roles" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" VARCHAR(10) DEFAULT 'default',

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."roles_descriptions" (
    "id" SERIAL NOT NULL,
    "description" VARCHAR(300) NOT NULL,
    "role_id" BIGINT NOT NULL,
    "lng_id" VARCHAR(5) NOT NULL,

    CONSTRAINT "roles_descriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."roles_names" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(20) NOT NULL,
    "role_id" BIGINT NOT NULL,
    "lng_id" VARCHAR(5) NOT NULL,

    CONSTRAINT "roles_names_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."roles_permissions" (
    "role_id" BIGINT NOT NULL,
    "permission_id" BIGINT NOT NULL,
    "assigned_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "public"."session" (
    "sid" VARCHAR NOT NULL,
    "sess" JSON NOT NULL,
    "expire" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone_number" VARCHAR(20) NOT NULL,
    "email" TEXT,
    "role_id" BIGINT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN DEFAULT true,
    "avatar_url" TEXT,
    "dni" VARCHAR(10),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_audit_logs_created_at" ON "public"."audit_logs"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_audit_logs_module" ON "public"."audit_logs"("module");

-- CreateIndex
CREATE INDEX "idx_audit_logs_user_id" ON "public"."audit_logs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "book_copies_inventory_number_key" ON "public"."book_copies"("inventory_number");

-- CreateIndex
CREATE UNIQUE INDEX "books_isbn_key" ON "public"."books"("isbn");

-- CreateIndex
CREATE UNIQUE INDEX "borrowers_dni_key" ON "public"."borrowers"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "uq_dewey_lang" ON "public"."dewey_classifications_translations"("dewey_classification_id", "lang_code");

-- CreateIndex
CREATE UNIQUE INDEX "keywords_keyword_key" ON "public"."keywords"("keyword");

-- CreateIndex
CREATE INDEX "idx_unique_active_copy" ON "public"."loans_copies"("copy_id");

-- CreateIndex
CREATE UNIQUE INDEX "modules_name_key" ON "public"."modules"("name");

-- CreateIndex
CREATE INDEX "idx_permissions_module_id" ON "public"."permissions"("module_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_module_permission" ON "public"."permissions"("module_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "public"."roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "uq_roles_descriptions_role_lang" ON "public"."roles_descriptions"("role_id", "lng_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_roles_names_role_lang" ON "public"."roles_names"("role_id", "lng_id");

-- CreateIndex
CREATE INDEX "idx_roles_permissions_role_id" ON "public"."roles_permissions"("role_id");

-- CreateIndex
CREATE INDEX "IDX_session_expire" ON "public"."session"("expire");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "ft_audit_logs_users" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."books" ADD CONSTRAINT "fk_books_dewey_classification" FOREIGN KEY ("dewey_category_id") REFERENCES "public"."dewey_classifications"("code") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."books_keywords" ADD CONSTRAINT "books_keywords_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."books_keywords" ADD CONSTRAINT "books_keywords_keyword_id_fkey" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."borrower_status_history" ADD CONSTRAINT "borrower_status_history_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."borrower_status_history" ADD CONSTRAINT "borrower_status_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."dewey_classifications_translations" ADD CONSTRAINT "fk_translations_dewey" FOREIGN KEY ("dewey_classification_id") REFERENCES "public"."dewey_classifications"("code") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."dewey_classifications_translations" ADD CONSTRAINT "fk_translations_language" FOREIGN KEY ("lang_code") REFERENCES "public"."languages"("code") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."faq_translations" ADD CONSTRAINT "faq_translations_faq_id_fkey" FOREIGN KEY ("faq_id") REFERENCES "public"."faqs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."faq_translations" ADD CONSTRAINT "faq_translations_language_code_fkey" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("code") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."loans" ADD CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."loans" ADD CONSTRAINT "loans_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "public"."borrowers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."loans_copies" ADD CONSTRAINT "loans_copies_copy_id_fkey" FOREIGN KEY ("copy_id") REFERENCES "public"."book_copies"("copy_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."loans_copies" ADD CONSTRAINT "loans_copies_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."permissions" ADD CONSTRAINT "fk_permissions_module" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."roles_descriptions" ADD CONSTRAINT "fk_roles_descriptions_language" FOREIGN KEY ("lng_id") REFERENCES "public"."languages"("code") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."roles_descriptions" ADD CONSTRAINT "fk_roles_descriptions_role" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."roles_names" ADD CONSTRAINT "fk_lng" FOREIGN KEY ("lng_id") REFERENCES "public"."languages"("code") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."roles_names" ADD CONSTRAINT "fk_role" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."roles_permissions" ADD CONSTRAINT "fk_roles_permissions_permission" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."roles_permissions" ADD CONSTRAINT "fk_roles_permissions_role" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

