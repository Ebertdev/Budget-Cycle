import { formatarReais, reaisParaCentavos } from "./dinheiro";
import { ROTULO_STATUS, formatarData, formatarHorario } from "./formato";
import type { Orcamento } from "./tipos";
import { formatarTelefone } from "./validacao";

const LOJA = "Bicicloed";

const dinheiro = (reais: number) => formatarReais(reaisParaCentavos(reais));

export function nomeArquivo(o: Orcamento): string {
  const nome = o.nomeCliente
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `orcamento-${o.id}-${nome || "cliente"}.pdf`;
}

/** Texto pronto para colar no WhatsApp ou em um e-mail. */
export function textoOrcamento(o: Orcamento): string {
  const linhas = [
    `*${LOJA} · Orçamento nº ${o.id}*`,
    `Feito em ${formatarData(o.dataOrcamento)}`,
    "",
    `Cliente: ${o.nomeCliente}`,
    `Telefone: ${formatarTelefone(o.telefone)}`,
    `Entrega: ${formatarData(o.dataEntrega)} às ${formatarHorario(o.horarioEntrega)}`,
    "",
    "Serviços",
    ...o.servicos.map((s) => `- ${s.descricao}: ${dinheiro(s.valor)}`),
  ];
  if (o.pecas.length > 0) {
    linhas.push(
      "",
      "Peças",
      ...o.pecas.map((p) => `- ${p.nomePeca} (${p.quantidade}× ${dinheiro(p.valorUnitario)}): ${dinheiro(p.subtotal)}`),
    );
  }
  linhas.push("", `*Total: ${dinheiro(o.valorTotal)}*`);
  if (o.observacoes) linhas.push("", `Observações: ${o.observacoes}`);
  return linhas.join("\n");
}

/** Gera o PDF no aparelho (sem enviar nada ao servidor). A biblioteca só carrega quando alguém exporta. */
export async function gerarPdf(o: Orcamento): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const esq = 20;
  const dir = 190;
  let y = 24;

  const verde: [number, number, number] = [26, 122, 95];
  const texto: [number, number, number] = [14, 26, 24];
  const suave: [number, number, number] = [81, 90, 87];

  const proxima = (altura: number) => {
    if (y + altura > 280) {
      doc.addPage();
      y = 24;
    }
  };

  doc.setFont("helvetica", "bold").setFontSize(20).setTextColor(...verde);
  doc.text(LOJA, esq, y);
  doc.setFontSize(11).setTextColor(...suave).setFont("helvetica", "normal");
  doc.text(`Orçamento nº ${o.id}`, dir, y, { align: "right" });
  y += 6;
  doc.text(`Feito em ${formatarData(o.dataOrcamento)}`, dir, y, { align: "right" });
  y += 5;
  doc.setDrawColor(...verde).setLineWidth(0.6).line(esq, y, dir, y);
  y += 10;

  const campo = (rotulo: string, valor: string) => {
    doc.setFontSize(9).setTextColor(...suave).setFont("helvetica", "normal").text(rotulo, esq, y);
    doc.setFontSize(12).setTextColor(...texto).text(valor, esq + 32, y);
    y += 7;
  };
  campo("Cliente", o.nomeCliente);
  campo("Telefone", formatarTelefone(o.telefone));
  campo("Entrega", `${formatarData(o.dataEntrega)} às ${formatarHorario(o.horarioEntrega)}`);
  campo("Situação", ROTULO_STATUS[o.status]);
  y += 4;

  const titulo = (t: string) => {
    proxima(16);
    doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(...texto).text(t, esq, y);
    y += 3;
    doc.setDrawColor(200, 205, 203).setLineWidth(0.2).line(esq, y, dir, y);
    y += 7;
  };
  const item = (descricao: string, detalhe: string | null, valor: string) => {
    const quebrado: string[] = doc.splitTextToSize(descricao, 118);
    proxima(quebrado.length * 5 + 6);
    doc.setFont("helvetica", "normal").setFontSize(11).setTextColor(...texto);
    doc.text(quebrado, esq, y);
    doc.text(valor, dir, y, { align: "right" });
    y += quebrado.length * 5;
    if (detalhe) {
      doc.setFontSize(9).setTextColor(...suave).text(detalhe, esq, y);
      y += 4.5;
    }
    y += 2;
  };

  titulo("Serviços");
  o.servicos.forEach((s) => item(s.descricao, null, dinheiro(s.valor)));

  if (o.pecas.length > 0) {
    y += 3;
    titulo("Peças trocadas");
    o.pecas.forEach((p) =>
      item(p.nomePeca, `${p.quantidade} × ${dinheiro(p.valorUnitario)}`, dinheiro(p.subtotal)),
    );
  }

  y += 4;
  proxima(16);
  doc.setDrawColor(...verde).setLineWidth(0.6).line(esq, y, dir, y);
  y += 8;
  doc.setFont("helvetica", "bold").setFontSize(14).setTextColor(...texto);
  doc.text("Valor total", esq, y);
  doc.setTextColor(...verde).text(dinheiro(o.valorTotal), dir, y, { align: "right" });
  y += 10;

  if (o.observacoes) {
    titulo("Observações");
    const linhas: string[] = doc.splitTextToSize(o.observacoes, dir - esq);
    doc.setFont("helvetica", "normal").setFontSize(11).setTextColor(...texto);
    for (const linha of linhas) {
      proxima(6);
      doc.text(linha, esq, y);
      y += 5.5;
    }
  }

  return doc.output("blob");
}
