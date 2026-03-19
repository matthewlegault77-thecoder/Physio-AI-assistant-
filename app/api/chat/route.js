import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '../../../lib/supabase/server';

export async function POST(request) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'API key not configured.' }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { message, planData, history } = body;

  if (!message || !planData) {
    return Response.json({ error: 'Missing message or plan data.' }, { status: 400 });
  }

  const systemPrompt = `You are a friendly, knowledgeable physiotherapy assistant embedded in a treatment plan page. The user has just received an AI-generated treatment plan and may have questions about it.

Here is their treatment plan data:
- Diagnosis: ${planData.diagnosis?.title}
- Severity: ${planData.diagnosis?.severity}
- Healing Time: ${planData.diagnosis?.healingTime}
- Causes: ${planData.why?.join(', ') || 'Not specified'}
- Recovery Phases: ${planData.solution?.map(p => `${p.phase} (${p.timeline}): ${p.actions?.join('; ')}`).join(' | ') || 'Not specified'}
- Next Steps: ${planData.nextSteps?.map(s => `${s.when}: ${s.action}`).join(' | ') || 'Not specified'}
- Red Flag: ${planData.redFlag || 'None specified'}

Your role:
- Answer questions about the treatment plan in simple, easy-to-understand language
- Explain medical/anatomical terms (e.g. "What is a patellar tendon?") clearly for a non-medical audience
- Provide additional context about exercises, recovery phases, or timelines mentioned in the plan
- Be encouraging and supportive
- Keep responses concise (2-4 sentences for simple questions, more for complex ones)
- If asked something outside the scope of the treatment plan or physiotherapy, politely redirect
- Always remind users that this is educational guidance, not a replacement for professional medical advice, if they ask about changing their treatment
- Do NOT use markdown formatting — respond in plain text only`;

  // Build conversation messages from history
  const messages = [];
  if (history && Array.isArray(history)) {
    for (const msg of history.slice(-10)) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    }
  }
  messages.push({ role: 'user', content: message });

  const client = new Anthropic({ apiKey });

  try {
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: systemPrompt,
      messages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta?.text) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err) {
    return Response.json({ error: err.message || 'Failed to generate response.' }, { status: 500 });
  }
}
