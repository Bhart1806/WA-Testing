import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const supabase = await createAdminClient();

    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 },
      );
    }

    const { data: logs, error: logsError } = await supabase
      .from('campaign_logs')
      .select(
        `
        *,
        contact:contacts(
          id,
          phone,
          name,
          email
        )
      `,
      )
      .eq('campaign_id', id)
      .order('created_at', { ascending: true });

    if (logsError) {
      throw logsError;
    }

    return NextResponse.json({
      campaign,
      logs: logs ?? [],
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: 'Failed to fetch campaign details' },
      { status: 500 },
    );
  }
}
