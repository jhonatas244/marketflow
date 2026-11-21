import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.productName || typeof body.productName !== 'string') {
      return NextResponse.json(
        { error: 'Informe o nome do produto' },
        { status: 400 }
      );
    }

    const response = await fetch('http://127.0.0.1:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen2.5:3b',
        stream: false,
        format: 'json',
        messages: [
          {
            role: 'system',
            content: `
Você é o especialista em marketing digital da MARKETFLOW.

Crie conteúdos profissionais para marketing de afiliados no Brasil.

O conteúdo deve ser natural, convincente, criativo e humano.
Evite exageros, frases genéricas e promessas falsas.

Não invente características, avaliações, descontos,
preços ou benefícios que não foram informados.

Retorne exclusivamente um JSON válido neste formato:

{
  "titulo": "Título chamativo",
  "gancho": "Frase inicial para prender a atenção",
  "roteiro": "Roteiro de vídeo de 20 a 30 segundos",
  "legenda": "Legenda profissional para publicação",
  "cta": "Chamada para ação",
  "hashtags": "#hashtag1 #hashtag2 #hashtag3",
  "aviso_afiliado": "Aviso transparente sobre link de afiliado"
}
            `,
          },
          {
            role: 'user',
            content: JSON.stringify({
              produto: body.productName,
              categoria: body.category,
              loja: body.store,
              preco: body.price,
              detalhes: body.details || '',
              canal: body.platform || 'Instagram Reels',
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }

    const result = await response.json();
    const content = result.message?.content || '{}';

    return NextResponse.json(JSON.parse(content));

  } catch (error) {
    console.error('ERRO DETALHADO:', error);

    return NextResponse.json(
      {
        error: 'Não foi possível gerar o conteúdo.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}