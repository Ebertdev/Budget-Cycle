import { ROTULO_STATUS } from "../formato";
import type { Status } from "../tipos";
import {
  IcAberto,
  IcAprovado,
  IcCancelado,
  IcEntregue,
  IcExecucao,
  IcPronto,
} from "./Icones";

const ICONE = {
  ABERTO: IcAberto,
  APROVADO: IcAprovado,
  EM_EXECUCAO: IcExecucao,
  PRONTO: IcPronto,
  ENTREGUE: IcEntregue,
  CANCELADO: IcCancelado,
} satisfies Record<Status, typeof IcAberto>;

export default function StatusChip({ status }: { status: Status }) {
  const Icone = ICONE[status];
  return (
    <span className={`status status-${status.toLowerCase()}`}>
      <Icone tamanho={14} />
      {ROTULO_STATUS[status]}
    </span>
  );
}
