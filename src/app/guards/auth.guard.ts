import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export const authGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    return true;
  }
  
  return router.parseUrl('/login');
};
