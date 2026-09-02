# Features

Cada domínio funcional viverá em sua própria pasta e poderá conter `components`, `hooks`,
`pages`, `schemas`, `services` e `types`. Dependências entre domínios devem passar por APIs
públicas explícitas (`index.ts`) e nunca por imports internos profundos.

Os domínios serão adicionados somente no bloco em que forem autorizados.
