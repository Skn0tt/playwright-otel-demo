import { trace } from "@opentelemetry/api";

export const getServerSideProps = async () => {
  return { props: {} };
};

export default function Home() {
  const span = trace.getTracer("Home").startSpan("rendering");
  span.addEvent('foo');
  span.end();

  return (
    <main>
      <p>
        While rendering this page, a span was emitted.
        Click this button to reload and emit another span:
      </p>
      <button onClick={() => location.reload()}>Click me if you can</button>
    </main>
  );
}
