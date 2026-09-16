export default function QuestionTable({ table }) {
  if (!table?.headers?.length || !table?.rows?.length) return null;
  return (
    <figure className="my-4">
      {table.caption ? (
        <figcaption className="mb-2 text-center text-[0.95rem] font-bold">
          {table.caption}
        </figcaption>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[0.95rem]">
          <thead>
            <tr>
              {table.headers.map((h, i) => (
                <th
                  key={i}
                  scope="col"
                  className="border border-bb-line bg-neutral-100 px-3 py-2 text-left font-bold"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} className="border border-bb-line px-3 py-2">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {table.note ? (
        <p className="mt-1 text-xs text-bb-muted">Note: {table.note}</p>
      ) : null}
    </figure>
  );
}
