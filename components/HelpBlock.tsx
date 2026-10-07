'use client';
import { useState } from 'react';
import data from '@/data/helplines.json';

interface Props {
  /** true — показываем блок экстренной помощи (ответ на вопрос о самоповреждении). */
  crisis: boolean;
}

export default function HelpBlock({ crisis }: Props) {
  const [code, setCode] = useState(data.default);
  const country = data.countries.find((c) => c.code === code) ?? data.countries[0];

  return (
    <section
      aria-labelledby="help-title"
      className={`rounded-xl2 border p-5 ${crisis ? 'border-warm bg-warm-soft' : 'border-line bg-accent-soft'}`}
    >
      <h2 id="help-title" className="text-lg font-semibold">
        {crisis ? 'Вам не нужно справляться с этим в одиночку' : 'Возможно, стоит поговорить со специалистом'}
      </h2>
      <p className="mt-2 text-[15px]">
        {crisis
          ? 'Вы отметили мысли о смерти или о том, чтобы причинить себе вред. Спасибо, что были честны. Пожалуйста, расскажите об этом близкому человеку или обратитесь за помощью прямо сейчас. Если есть риск для жизни — звоните в экстренную службу.'
          : 'Ваш результат говорит о том, что симптомы заметно выражены. Это не диагноз, но с такими состояниями можно получать поддержку: обратитесь к врачу, психотерапевту или клиническому психологу.'}
      </p>

      <label className="mt-4 block text-sm">
        <span className="mr-2 text-muted">Страна:</span>
        <select
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="min-h-[40px] rounded-lg border border-line bg-surface px-3"
        >
          {data.countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <ul className="mt-3 space-y-3">
        {country.lines.map((l) => (
          <li key={l.name} className="rounded-xl bg-surface p-3">
            <p className="text-sm text-muted">{l.name}</p>
            <p className="text-lg font-semibold">{l.phone}</p>
            <p className="text-sm">{l.note}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
