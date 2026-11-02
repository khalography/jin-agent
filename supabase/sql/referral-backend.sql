-- Backend-only operations. No public RPC execution privileges.
alter table public.jin_referral_bindings add column paid_units integer not null default 0 check(paid_units between 0 and 9), add column checked_block bigint, add column qualified_block bigint;
create index jin_referral_bindings_pending on public.jin_referral_bindings(referrer_id,checked_block nulls first) where paid_units<9;
create function public.jin_register_referral(p_challenge uuid,p_referrer text,p_referred text,p_referrer_handle text,p_referred_handle text,p_referrer_wallet text,p_referred_wallet text,p_block bigint)
returns void language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 perform 1 from public.jin_referral_challenges where id=p_challenge and consumed_at is null and expires_at>now() and wallet=p_referred_wallet for update;
 if not found then raise exception 'Challenge expired or already used'; end if;
 if p_referrer=p_referred or p_referrer_wallet=p_referred_wallet then raise exception 'Self referrals are not allowed'; end if;
 insert into public.jin_referral_identities(identity_key,handle,verified_wallet,verified_block) values(p_referrer,p_referrer_handle,p_referrer_wallet,p_block),(p_referred,p_referred_handle,p_referred_wallet,p_block)
 on conflict(identity_key) do update set verified_wallet=excluded.verified_wallet,verified_block=excluded.verified_block;
 insert into public.jin_referral_bindings(referred_id,referrer_id,referred_wallet,referrer_wallet,challenge_id,attribution_block) values(p_referred,p_referrer,p_referred_wallet,p_referrer_wallet,p_challenge,p_block);
 update public.jin_referral_challenges set consumed_at=now() where id=p_challenge;
end $$;
revoke all on function public.jin_register_referral(uuid,text,text,text,text,text,text,bigint) from public,anon,authenticated;
grant execute on function public.jin_register_referral(uuid,text,text,text,text,text,text,bigint) to service_role;
create function public.jin_allocate_referral_rewards(p_referrer text) returns integer language plpgsql security invoker set search_path=public,pg_temp as $$
declare members text[]; next_group integer; earned integer:=0;
begin
 perform 1 from public.jin_referral_identities where identity_key=p_referrer for update;
 if not found then return 0; end if;
 loop
 select array_agg(referred_id) into members from (
 select b.referred_id from public.jin_referral_bindings b where b.referrer_id=p_referrer and b.paid_units=9 and b.qualified_block is not null
 and not exists(select 1 from public.jin_referral_reward_members m where m.referred_id=b.referred_id)
 order by b.created_at,b.referred_id limit 3) eligible;
 exit when coalesce(array_length(members,1),0)<3;
 select coalesce(max(group_number),0)+1 into next_group from public.jin_referral_rewards where referrer_id=p_referrer;
 insert into public.jin_referral_rewards(referrer_id,group_number) values(p_referrer,next_group);
 insert into public.jin_referral_reward_members(referred_id,referrer_id,group_number) select unnest(members),p_referrer,next_group;
 earned:=earned+1;
 end loop;
 return earned;
end $$;
revoke all on function public.jin_allocate_referral_rewards(text) from public,anon,authenticated;
grant execute on function public.jin_allocate_referral_rewards(text) to service_role;
