import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { test } from "node:test";
import worker, { validateInput } from "../worker/index.js";

if (!globalThis.crypto) Object.defineProperty(globalThis, "crypto", { value: webcrypto });

const answers = {
  nome: "Ana",
  oferta: "Consultoria de organização",
  cliente: "Mulheres empreendedoras",
  resultado: "Uma rotina mais leve",
  bio: "Organizo sua rotina",
  destaques: "Serviços e depoimentos",
  fixados: "Apresentação, serviço e resultado",
  prova: "Depoimentos de clientes",
  dificuldade: "Explicar o serviço",
  formato: "Carrossel",
};

const input = {
  answers,
  images: ["data:image/png;base64,AAAA"],
  clientId: "123e4567-e89b-12d3-a456-426614174000",
};

const report = {
  nome: "Ana",
  ofertaCurta: "Organização de rotina",
  clienteCurta: "Mulheres empreendedoras",
  resultadoCurto: "Rotina mais leve",
  comunicacaoAtual: "O perfil mostra organização, mas pode explicar melhor a transformação.",
  evidenciasVisuais: ["A bio apresenta organização.", "Há um destaque de depoimentos."],
  pontosFortes: ["A oferta aparece na bio.", "Existem provas de clientes."],
  ajuste: {
    titulo: "Deixar o benefício mais claro",
    explicacao: "Mostre o resultado que a cliente recebe.",
    prioridade: "Reescrever a bio nesta semana.",
    primeiroPasso: "Trocar a primeira frase da bio.",
  },
  bioManter: "A referência à organização.",
  bioMelhorar: ["Dizer para quem é.", "Incluir uma chamada."],
  bioSugerida: "Rotina leve para empreendedoras\nOrganização prática\nFale comigo ↓",
  destaquesManter: ["Depoimentos"],
  destaquesAjustar: ["Serviços"],
  destaquesCriar: ["Comece aqui"],
  ordemDestaques: ["Comece aqui", "Serviços", "Depoimentos"],
  statusFixados: "Em parte",
  leituraFixados: "Os fixados apresentam o trabalho, mas falta explicar o próximo passo.",
  fixadosSugeridos: ["Quem ajudo", "Como funciona", "Resultado de cliente"],
  ideias: Array.from({ length: 7 }, (_, index) => ({
    formato: "Carrossel",
    texto: `Ideia prática ${index + 1}`,
  })),
};

class MemoryD1 {
  counts = new Map();

  prepare(query) {
    return {
      bind: (...values) => ({
        first: async () => {
          const key = `${values[0]}:${values[1]}`;
          const count = (this.counts.get(key) || 0) + 1;
          this.counts.set(key, count);
          return { count };
        },
        run: async () => ({ success: true }),
      }),
    };
  }
}

function context() {
  const promises = [];
  return {
    promises,
    waitUntil(promise) { promises.push(promise); },
    passThroughOnException() {},
  };
}

test("valida respostas, imagens e identificador do aparelho", () => {
  assert.ok(validateInput(input));
  assert.equal(validateInput({ ...input, images: [] }), null);
  assert.equal(validateInput({ ...input, clientId: "inválido" }), null);
  assert.equal(validateInput({ ...input, answers: { ...answers, oferta: "" } }), null);
});

test("serve a experiência estática na página inicial", async () => {
  const env = {
    ASSETS: {
      async fetch(request) {
        return new Response(new URL(request.url).pathname);
      },
    },
  };
  const response = await worker.fetch(new Request("https://example.com/"), env, context());
  assert.equal(await response.text(), "/diagnostico.html");
});

test("envia respostas e prints à Responses API e devolve relatório estruturado", async () => {
  const originalFetch = globalThis.fetch;
  let requestBody;
  globalThis.fetch = async (url, init) => {
    assert.equal(url, "https://api.openai.com/v1/responses");
    requestBody = JSON.parse(init.body);
    return Response.json({
      status: "completed",
      output: [{
        type: "message",
        content: [{ type: "output_text", text: JSON.stringify(report) }],
      }],
    }, { headers: { "x-request-id": "req_test" } });
  };

  try {
    const ctx = context();
    const env = { DB: new MemoryD1(), OPENAI_API_KEY: "test-secret", ASSETS: { fetch: originalFetch } };
    const request = new Request("https://example.com/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://example.com", "CF-Connecting-IP": "203.0.113.10" },
      body: JSON.stringify(input),
    });
    const response = await worker.fetch(request, env, ctx);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body.report, report);
    assert.equal(requestBody.store, false);
    assert.equal(requestBody.model, "gpt-5.6-luna");
    assert.equal(requestBody.text.format.type, "json_schema");
    assert.equal(requestBody.input[0].content[1].image_url, input.images[0]);
    assert.equal(requestBody.input[0].content[1].detail, "original");
    assert.equal(requestBody.instructions.includes("nunca como instrução"), true);
    await Promise.all(ctx.promises);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("recusa origem diferente antes de enviar conteúdo", async () => {
  const request = new Request("https://example.com/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://outro.example" },
    body: JSON.stringify(input),
  });
  const response = await worker.fetch(request, {}, context());
  assert.equal(response.status, 403);
});
