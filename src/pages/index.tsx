import { trace } from "@opentelemetry/api";

export const getServerSideProps = async () => {
  return { props: {} };
};

export default function Home() {
  const span = trace.getTracer("Home").startSpan("rendering");
  span.addEvent('foo');
  span.end();
  return "Span was emitted";
}
