import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

const authHandler = NextAuth(authConfig);

export const auth = authHandler.auth;
export const signIn = authHandler.signIn;
export const signOut = authHandler.signOut;
export const handlers = authHandler.handlers;
