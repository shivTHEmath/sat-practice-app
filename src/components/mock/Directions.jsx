/* Section directions, as shown in the Directions dropdown and grid-in pane. */

export function ReadingWritingDirections() {
  return (
    <>
      <p>
        The questions in this section address a number of important reading and writing
        skills. Each question includes one or more passages, which may include a table or
        graph. Read each passage and question carefully, and then choose the best answer
        to the question based on the passage(s).
      </p>
      <p>
        All questions in this section are multiple-choice with four answer choices. Each
        question has a single best answer.
      </p>
    </>
  );
}

const EXAMPLES = [
  ["3.5", ["3.5", "3.50", "7/2"], ["31/2", "3 1/2"]],
  ["2/3", ["2/3", ".6666", ".6667", "0.666", "0.667"], ["0.66", ".66", "0.67", ".67"]],
  ["-1/3", ["-1/3", "-.3333", "-0.333"], ["-.33", "-0.33"]],
];

export function StudentResponseDirections() {
  return (
    <div className="mk-spr-directions">
      <h2>Student-produced response directions</h2>
      <ul>
        <li>If you find <strong>more than one correct answer</strong>, enter only one answer.</li>
        <li>
          You can enter up to 5 characters for a <strong>positive</strong> answer and up to 6
          characters (including the negative sign) for a <strong>negative</strong> answer.
        </li>
        <li>
          If your answer is a <strong>fraction</strong> that doesn’t fit in the provided space,
          enter the decimal equivalent.
        </li>
        <li>
          If your answer is a <strong>decimal</strong> that doesn’t fit in the provided space,
          enter it by truncating or rounding at the fourth digit.
        </li>
        <li>
          If your answer is a <strong>mixed number</strong> (such as 3½), enter it as an
          improper fraction (7/2) or its decimal equivalent (3.5).
        </li>
        <li>
          Don’t enter <strong>symbols</strong> such as a percent sign, comma, or dollar sign.
        </li>
      </ul>
      <h3>Examples</h3>
      <table>
        <thead>
          <tr>
            <th scope="col">Answer</th>
            <th scope="col">Acceptable ways to enter answer</th>
            <th scope="col">Unacceptable: will NOT receive credit</th>
          </tr>
        </thead>
        <tbody>
          {EXAMPLES.map(([answer, ok, bad]) => (
            <tr key={answer}>
              <td>{answer}</td>
              <td>{ok.map((v) => <div key={v}>{v}</div>)}</td>
              <td>{bad.map((v) => <div key={v}>{v}</div>)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MathDirections() {
  return (
    <>
      <p>
        The questions in this section address a number of important math skills. Use of a
        calculator is permitted for all questions. A reference sheet, calculator, and these
        directions can be accessed throughout the test.
      </p>
      <p>Unless otherwise indicated:</p>
      <ul>
        <li>All variables and expressions represent real numbers.</li>
        <li>Figures provided are drawn to scale.</li>
        <li>All figures lie in a plane.</li>
        <li>
          The domain of a given function <i>f</i> is the set of all real numbers <i>x</i> for
          which <i>f</i>(<i>x</i>) is a real number.
        </li>
      </ul>
      <p>
        For <strong>multiple-choice questions</strong>, solve each problem and choose the
        correct answer from the choices provided. Each multiple-choice question has a single
        correct answer.
      </p>
      <p>
        For <strong>student-produced response questions</strong>, solve each problem and
        enter your answer as described below.
      </p>
      <StudentResponseDirections />
    </>
  );
}
