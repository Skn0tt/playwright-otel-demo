
import type { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult, TestStep } from '@playwright/test/reporter';
import * as opentelemetry from '@opentelemetry/api'
import {
  BasicTracerProvider,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';

class OtelReporter implements Reporter {
  private _spans = new Map<TestStep | TestCase, opentelemetry.Span>();
  private _tracer: opentelemetry.Tracer;
  private _rootSpan!: opentelemetry.Span;

  constructor() {
    const tracerProvider = new BasicTracerProvider({
      spanProcessors: [
        // new SimpleSpanProcessor(new ConsoleSpanExporter()),
        new SimpleSpanProcessor(new OTLPTraceExporter()),
      ]
    });
    this._tracer = tracerProvider.getTracer('playwright-reporter');
  }

  onBegin(config: FullConfig, suite: Suite): void {
    this._rootSpan = this._tracer.startSpan('testrun');
  }

  onTestBegin(test: TestCase, result: TestResult): void {
    const context = opentelemetry.trace.setSpan(opentelemetry.context.active(), this._rootSpan);
    const span = this._tracer.startSpan(test.title, undefined, context);
    this._spans.set(test, span);
  }

  onStepBegin(test: TestCase, result: TestResult, step: TestStep): void {
    const parent = this._spans.get(step.parent ?? test);
    if (!parent)
      throw new Error(`Unexpected: Parent span not found for step ${step.title}`);

    const context = opentelemetry.trace.setSpan(opentelemetry.context.active(), parent);
    const span = this._tracer.startSpan(step.title, undefined, context);;
    this._spans.set(step, span);
  }

  onStepEnd(test: TestCase, result: TestResult, step: TestStep): void {
    const span = this._spans.get(step);
    if (!span)
      throw new Error(`Unexpected: Span not found for step ${step.title}`);

    const spanId = step.attachments.find(a => a.name === 'spanId')?.body?.toString('utf-8');
    if (spanId)
      span.setAttribute('playwright span id', spanId);

    span.end();
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const span = this._spans.get(test);
    if (!span)
      throw new Error(`Unexpected: Span not found for test ${test.title}`);
    span.end();
  }

  onEnd(result: FullResult) {
    this._rootSpan.end();
  }
}

export default OtelReporter;