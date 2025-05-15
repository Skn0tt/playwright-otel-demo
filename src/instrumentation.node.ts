import { NodeSDK } from '@opentelemetry/sdk-node'
import { SimpleSpanProcessor, ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'
import { resourceFromAttributes } from '@opentelemetry/resources'
 
const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'playwright-otel-demo',
  }),
  spanProcessor: new SimpleSpanProcessor(new ConsoleSpanExporter()),
})
sdk.start()
