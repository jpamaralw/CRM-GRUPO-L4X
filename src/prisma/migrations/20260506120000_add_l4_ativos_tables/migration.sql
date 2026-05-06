-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "valorDivida" TEXT,
    "situacao" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "origem" TEXT NOT NULL DEFAULT 'PGFN',
    "status" TEXT NOT NULL DEFAULT 'NOVO',
    "responsavelId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineAtivo" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "tribunal" TEXT,
    "valorCausa" TEXT,
    "fase" TEXT,
    "responsavelId" TEXT,
    "dataFechamento" TIMESTAMP(3),
    "comissao" DOUBLE PRECISION,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PipelineAtivo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_cnpj_key" ON "Lead"("cnpj");
