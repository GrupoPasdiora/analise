# Diagnóstico Mel

Questionário simples para analisar perfis do Instagram. A participante responde 10 perguntas claras, envia até 3 prints e recebe uma devolutiva personalizada com pontos fortes, principal ajuste, bio sugerida, destaques, fixados, 7 ideias de conteúdo e uma prioridade para a semana.

## Privacidade e segurança

- A chave da OpenAI fica somente no servidor.
- As respostas e os prints são enviados apenas quando a participante pede a análise.
- O sistema não salva respostas nem imagens.
- A chamada à OpenAI usa `store: false`.
- Há limite de análises por aparelho e por rede para reduzir abuso e custos inesperados.

## Validação local

Requer Node.js 22.13 ou superior.

```bash
npm install
npm test
```

As variáveis esperadas estão em `.env.example`. A publicação usa um banco D1 para o controle de uso; a migração fica em `drizzle/`.
