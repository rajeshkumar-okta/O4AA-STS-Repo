'use client';

import { useState } from 'react';
import { TokenExchange } from '@/types';
import { ChevronDown, ChevronRight, Key, Shield, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface TokenFlowAnalysisProps {
  exchanges: TokenExchange[];
  isLoading?: boolean;
  activeService?: 'github' | 'jira';
}

export default function TokenFlowAnalysis({ exchanges, isLoading, activeService = 'github' }: TokenFlowAnalysisProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const latestExchange = exchanges.length > 0 ? exchanges[exchanges.length - 1] : null;
  const tokenDetails = latestExchange?.token_details;

  const serviceName = latestExchange?.agent_name.toLowerCase().includes('jira') ? 'Jira' :
                     latestExchange?.agent_name.toLowerCase().includes('github') ? 'GitHub' :
                     activeService === 'jira' ? 'Jira' : 'GitHub';

  const hasIdToken = !!tokenDetails?.id_token?.decoded;
  const hasClientAssertion = !!tokenDetails?.client_assertion?.decoded;

  return (
    <div className="rounded-xl shadow-lg overflow-hidden" style={{ backgroundColor: '#26a69a' }}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-white hover:bg-white/10 transition"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Key className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="font-semibold">Token Flow Analysis</div>
            <div className="text-xs text-white/70">OAuth-STS Exchange Details</div>
          </div>
        </div>
        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 animate-fadeIn">
          {/* OAuth-STS Flow Steps Summary */}
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs font-semibold text-white/80 uppercase tracking-wide mb-2 flex items-center space-x-2">
              <Shield className="w-3 h-3" />
              <span>OAuth-STS Exchange Flow</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  hasIdToken ? 'bg-green-400 text-green-900' : 'bg-white/30 text-white'
                }`}>
                  {hasIdToken ? <CheckCircle className="w-3 h-3" /> : '1'}
                </div>
                <span className="text-sm text-white/90">ID Token → Okta STS</span>
              </div>

              <div className="flex items-center space-x-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  hasClientAssertion ? 'bg-green-400 text-green-900' : 'bg-white/30 text-white'
                }`}>
                  {hasClientAssertion ? <CheckCircle className="w-3 h-3" /> : '2'}
                </div>
                <span className="text-sm text-white/90">Client Assertion (JWT)</span>
              </div>

              <div className="flex items-center space-x-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  latestExchange?.status === 'granted'
                    ? 'bg-green-400 text-green-900'
                    : latestExchange?.status === 'interaction_required'
                    ? 'bg-yellow-400 text-yellow-900'
                    : isLoading
                    ? 'bg-blue-400 text-blue-900 animate-pulse'
                    : 'bg-white/30 text-white'
                }`}>
                  {latestExchange?.status === 'granted' ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : latestExchange?.status === 'interaction_required' ? (
                    <AlertCircle className="w-3 h-3" />
                  ) : isLoading ? (
                    <Clock className="w-3 h-3" />
                  ) : (
                    '3'
                  )}
                </div>
                <span className="text-sm text-white/90">
                  {serviceName} Access Token {latestExchange?.status === 'granted' ? '✓' : latestExchange?.status === 'interaction_required' ? '(Consent Required)' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Scopes Display */}
          {latestExchange && latestExchange.scopes && latestExchange.scopes.length > 0 && (
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-xs font-semibold text-white/80 uppercase tracking-wide mb-2">
                Granted Scopes
              </div>
              <div className="flex flex-wrap gap-1">
                {latestExchange.scopes.map((scope, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-green-500/30 text-green-200 text-[10px] rounded-full font-mono">
                    {scope}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Status Indicator */}
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  latestExchange?.status === 'granted'
                    ? 'bg-green-400 animate-pulse'
                    : latestExchange?.status === 'interaction_required'
                    ? 'bg-yellow-400 animate-pulse'
                    : isLoading
                    ? 'bg-blue-400 animate-pulse'
                    : 'bg-white/40'
                }`}></div>
                <span className="text-xs text-white/80">
                  {latestExchange?.status === 'granted'
                    ? 'Token Active'
                    : latestExchange?.status === 'interaction_required'
                    ? 'Consent Required'
                    : isLoading
                    ? 'Exchanging...'
                    : 'Awaiting Request'}
                </span>
              </div>
              {latestExchange && (
                <span className="text-xs text-white/60">
                  {exchanges.length} exchange{exchanges.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {!latestExchange && !isLoading && (
            <div className="text-center py-2">
              <p className="text-xs text-white/60">
                Send a message to see token exchange flow
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
