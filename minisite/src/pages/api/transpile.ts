import type { APIRoute } from 'astro';
import { transpile } from '../../utilities/transpile';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { code } = await request.json();
    if (typeof code !== 'string') {
      return new Response(JSON.stringify({ error: 'code must be a string' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const result = await transpile(code);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
