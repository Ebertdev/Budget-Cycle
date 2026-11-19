import { formatarHorario, partesData } from "../formato";

/** Selo âmbar da entrega: o único lugar do app que usa o Sinal. */
export default function Selo({ data, horario }: { data?: string; horario: string }) {
  const d = data ? partesData(data) : undefined;
  return (
    <div className="selo">
      {d && (
        <span className="selo-data">
          {d.diaSemana} {Number(d.dia)}
        </span>
      )}
      <span className="selo-hora">{formatarHorario(horario)}</span>
    </div>
  );
}
