-- MiaMe.co.il · Migration: pin search_path on public.match_knowledge.
--
-- Security hardening for the RAG retrieval function used by the demand brain
-- (brain/knowledge.ts → rpc/match_knowledge). Supabase advisor lint 0011
-- (function_search_path_mutable) flags functions without a fixed search_path:
-- a mutable path lets an object created earlier on the path shadow the intended
-- one. The function is SECURITY INVOKER and references only public objects
-- (the `knowledge` table + pgvector operators), so pinning the path is fully
-- behaviour-preserving — identical rows, identical order.
--
-- Applied out-of-band to production during the end-to-end audit; this file makes
-- the change tracked and reproducible (no drift between repo and prod).
-- Idempotent: ALTER ... SET is safe to run more than once.

alter function public.match_knowledge(vector, integer)
  set search_path = public, pg_temp;
