import { parsePassage } from "@/lib/passage-structure";
import QuestionTable from "./QuestionTable";

export default function QuestionContent({ question }) {
  const content = parsePassage(question.passage);

  return (
    <>
      <QuestionTable table={question.table_data} />
      {content.type === "paired" ? (
        <div className="passage-sections">
          {content.sections.map((section) => (
            <section key={section.label} className="passage-section">
              <h3 className="passage-label">{section.label}</h3>
              <p>{section.text}</p>
            </section>
          ))}
        </div>
      ) : content.type === "notes" ? (
        <div className="passage-notes-block">
          <p className="passage-notes-intro">{content.introduction}</p>
          <ul className="passage-notes">
            {content.items.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </div>
      ) : (
        <p>{content.text}</p>
      )}
    </>
  );
}
