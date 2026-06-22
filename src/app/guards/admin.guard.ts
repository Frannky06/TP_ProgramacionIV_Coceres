import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export const adminGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return router.parseUrl('/login');
  }

  const metadataRole =
    session.user.app_metadata?.['role'] ??
    session.user.user_metadata?.['role'] ??
    session.user.user_metadata?.['perfil'];

  if (typeof metadataRole === 'string' && metadataRole.toLowerCase() === 'admin') {
    return true;
  }

  const { data, error } = await supabase
    .from('roles')
    .select('role')
    .eq('user_id', session.user.id)
    .maybeSingle();

  const role = data?.role ?? null;

  if (!error && typeof role === 'string' && role.toLowerCase() === 'admin') {
    return true;
  }

  return router.parseUrl('/home');
};
