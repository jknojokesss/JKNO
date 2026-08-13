-- Read access to QuickBooks' own statements for signed-in users.
--
-- The qbo_* tables ship RLS-on with no policies (service-role writes only).
-- A client portal that displays QuickBooks' official P&L / balance sheet
-- needs to read them, so grant select to authenticated users.
--
-- Applied to Jerky Munch's project. Run in the MAIN project too, so the
-- Reydel financials page can show its QuickBooks balance sheet.
--
-- Note qbo_connections is deliberately NOT granted — it holds OAuth tokens
-- and stays service-role only.

drop policy if exists "authenticated read" on qbo_gl_summary;
drop policy if exists "authenticated read" on qbo_bs_summary;
drop policy if exists "authenticated read" on qbo_gl_txns;

create policy "authenticated read" on qbo_gl_summary for select to authenticated using (true);
create policy "authenticated read" on qbo_bs_summary for select to authenticated using (true);
create policy "authenticated read" on qbo_gl_txns   for select to authenticated using (true);
