import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { AuthService } from '../service/auth.service';

export const adminGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return router.parseUrl('/login');
  }

  const isAdmin = await authService.checkIsAdmin(session.user);

  return isAdmin ? true : router.parseUrl('/home');
};
