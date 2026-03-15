-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "contract_number" VARCHAR(50) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "base_salary" DECIMAL(12,2) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "base_salary" DECIMAL(12,2) NOT NULL,
    "bonus" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deduction" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net_salary" DECIMAL(12,2) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_banks" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "grade_level" INTEGER,
    "question_count" INTEGER NOT NULL DEFAULT 0,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "bank_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "difficulty" VARCHAR(20) NOT NULL DEFAULT 'medium',
    "options" JSONB DEFAULT '[]',
    "correct_answer" TEXT,
    "points" DECIMAL(3,1) NOT NULL DEFAULT 1.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_leads" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "parent_name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255),
    "student_name" VARCHAR(100),
    "status" VARCHAR(20) NOT NULL DEFAULT 'new',
    "source" VARCHAR(50),
    "note" TEXT,
    "assigned_to" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contracts_user_id_idx" ON "contracts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_school_id_contract_number_key" ON "contracts"("school_id", "contract_number");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_school_id_user_id_month_year_key" ON "payroll"("school_id", "user_id", "month", "year");

-- CreateIndex
CREATE INDEX "questions_bank_id_idx" ON "questions"("bank_id");

-- CreateIndex
CREATE INDEX "crm_leads_school_id_status_idx" ON "crm_leads"("school_id", "status");

-- CreateIndex
CREATE INDEX "crm_leads_phone_idx" ON "crm_leads"("phone");

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll" ADD CONSTRAINT "payroll_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll" ADD CONSTRAINT "payroll_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_banks" ADD CONSTRAINT "question_banks_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_banks" ADD CONSTRAINT "question_banks_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "question_banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
