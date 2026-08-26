/**
 * SUMIT (formerly OfficeGuy) environment configuration.
 *
 * Unlike PayMe, SUMIT does not publish a separate sandbox host — "test mode"
 * runs against the same production host with AuthoriseOnly charges (see
 * `testMode` below). Source: SUMIT's own officially-maintained Laravel SDK
 * (github.com/nm-digitalhub/SUMIT-Payment-Gateway-for-laravel), since SUMIT's
 * Swagger UI (app.sumit.co.il/help/developers/swagger) renders client-side and
 * exposes no fetchable spec. Endpoints below are taken verbatim from that SDK's
 * Saloon Request classes — treat as high-confidence but re-verify against
 * SUMIT support before enabling real charges, same posture as the PayMe TODO
 * list in docs/payments-architecture.md.
 */
export type SumitEnvironment = {
  apiBaseUrl: string
  companyId: string
  apiKey: string
  /** Public tokenization key — only needed for client-side PaymentsJS, unused server-side. */
  publicKey: string | null
  /** Runs AuthoriseOnly charges against the live host instead of a separate sandbox. */
  testMode: boolean
}

export const SUMIT_API_BASE_URL = 'https://api.sumit.co.il'
export const SUMIT_LIVE_HOST = 'api.sumit.co.il'

/** Body-level auth block sent on every SUMIT request. */
export type SumitCredentials = {
  CompanyID: number
  APIKey: string
}

/** Endpoint: POST /accounting/customers/create/ */
export type SumitCreateCustomerRequest = {
  Credentials: SumitCredentials
  Details: {
    Name: string
    EmailAddress: string
    Phone?: string
    Address?: string
    City?: string
    ZipCode?: string
    CompanyNumber?: string
  }
}

export type SumitCreateCustomerResponse = {
  Status?: number
  UserErrorMessage?: string
  Data?: {
    CustomerID?: number
  }
}

/**
 * Endpoint: POST /billing/payments/beginredirect/
 *
 * The third-party SDK's config comments claimed this mode has "no support for
 * recurring, tokens, or authorize-only" — a live test call (2026-08-13)
 * disproved that: the resulting payment DID include a full, reusable
 * `PaymentMethod.CreditCard_Token`. What's actually true is narrower: this
 * endpoint itself only ever performs a single charge (or, with
 * `AuthoriseOnly`, an auth+void with no money moved) — it does not accept a
 * "make this recurring" flag. This adapter therefore always sends
 * `AuthoriseOnly: 'true'` here and treats it purely as a card-capture step;
 * the real charge and recurring authorization happen afterward via
 * /billing/recurring/charge/ once the resulting token is known (see
 * app/api/payments/webhooks/sumit/return/route.ts), so the customer is only
 * ever charged once per checkout attempt.
 */
export type SumitBeginRedirectRequest = {
  Credentials: SumitCredentials
  Items: SumitLineItem[]
  Customer: { ID: number } | Record<string, never>
  VATIncluded: 'true' | 'false'
  DocumentLanguage?: string
  RedirectURL: string
  CancelRedirectURL: string
  AuthoriseOnly?: 'true' | 'false'
}

export type SumitLineItem = {
  Item: {
    Name: string
    SearchMode: 'Automatic'
  }
  Quantity: number
  UnitPrice: number
  Currency: string
}

export type SumitBeginRedirectResponse = {
  Status?: number
  UserErrorMessage?: string
  Data?: {
    RedirectURL?: string
  }
}

/**
 * Endpoint: POST /billing/recurring/charge/
 * First call (with PaymentMethod, incl. expiration — see SumitPaymentRecord)
 * establishes the recurring authorization and returns
 * Data.RecurringCustomerItemIDs. Subsequent calls re-charge by passing
 * RecurringPaymentID instead. A live test call (2026-08-13) confirmed SUMIT
 * DOES track and auto-schedule the next billing date server-side after this
 * — see the class doc in sumit-provider.ts for what that means for cancellation.
 */
export type SumitChargeRecurringRequest = {
  Credentials: SumitCredentials
  RecurringPaymentID?: string
  Items: SumitLineItem[]
  Customer?: { ID: number }
  PaymentMethod?: {
    CreditCard_Token: string
    /** Confirmed required by live testing — a token alone is rejected. */
    CreditCard_ExpirationMonth: number
    CreditCard_ExpirationYear: number
    Type: 1
  }
  /**
   * Single-use token from PaymentsJS (`og-token`) — the in-site card-entry
   * flow. SUMIT resolves the full card + expiration from it server-side, so
   * unlike `PaymentMethod.CreditCard_Token` it needs no separate expiry fields.
   * Mutually exclusive with `PaymentMethod`.
   */
  SingleUseToken?: string
  /** Gap between recurring charges in months: 1 = monthly, 12 = yearly. */
  Duration_Months?: number
  /** Number of charges; '' / omitted = open-ended until cancelled. */
  Recurrence?: string | number
  /** Installments per charge; '1' = full amount each cycle. */
  Payments_Count?: string
  VATIncluded: 'true' | 'false'
  SendDocumentByEmail: 'true' | 'false'
  DocumentDescription?: string
  DocumentLanguage?: string
  ExternalReference?: string
  AuthoriseOnly?: 'true' | 'false'
}

export type SumitPaymentRecord = {
  ID?: number
  CustomerID?: number
  AuthNumber?: string
  ValidPayment?: boolean
  Amount?: number
  /** Numeric enum on this endpoint family: 0=ILS, 1=USD, 2=EUR, 3=GBP. */
  Currency?: number
  /** String status code, e.g. "000" — distinct from the envelope's numeric Status. */
  Status?: string
  StatusDescription?: string
  /**
   * Confirmed by live test call (2026-08-13): this is the real recurring
   * identifier — an array, and it appears on BOTH `Data` and `Data.Payment`.
   * The third-party SDK this adapter was originally built from assumed a
   * singular `RecurringID` field, which does not exist in the real response.
   * Each id matches `RecurringItem.ID` from /billing/recurring/listforcustomer/.
   */
  RecurringCustomerItemIDs?: number[]
  /** Present on a completed payment — confirmed by a live /billing/payments/get/ call. */
  PaymentMethod?: {
    CreditCard_LastDigits?: string
    CreditCard_ExpirationMonth?: number
    CreditCard_ExpirationYear?: number
    CreditCard_Token?: string
    Type?: number
  }
}

export type SumitChargeRecurringResponse = {
  Status?: number
  UserErrorMessage?: string
  Data?: {
    RecurringCustomerItemIDs?: number[]
    DocumentID?: string | number
    CustomerID?: number
    Payment?: SumitPaymentRecord
  }
}

/** Endpoint: POST /billing/recurring/listforcustomer/ */
export type SumitListSubscriptionsRequest = {
  Credentials: SumitCredentials
  Customer: { ID: number }
  IncludeInactive: 'true' | 'false'
}

/** 0=Active, 1=Paused, 2=Cancelled, 3=Expired (per SUMIT SDK docs). */
export type SumitRecurringStatus = 0 | 1 | 2 | 3

export type SumitRecurringItem = {
  ID?: string | number
  Status?: SumitRecurringStatus
  Item?: { ID?: string | number; Name?: string; SKU?: string }
  UnitPrice?: number
  Quantity?: number
  Date_NextBilling?: string | null
  Date_PreviousBilling?: string | null
  Date_Start?: string | null
}

export type SumitListSubscriptionsResponse = {
  Status?: number
  UserErrorMessage?: string
  Data?: {
    RecurringItems?: SumitRecurringItem[]
  }
}

/**
 * Endpoint: POST /billing/recurring/cancel/
 * Confirmed by live test call (2026-08-13). Requires BOTH `Customer.ID` and
 * `RecurringCustomerItemID` (singular) — omitting `Customer` fails with
 * "Customer: יש להזין ערך בשדה Customer". `ID` alone (no `Customer`) and the
 * plural `RecurringID`/`RecurringCustomerItemIDs` field names were tried first
 * and rejected ("Customer item not found") before this shape was confirmed
 * working (`Status: 0`, item excluded from a subsequent IncludeInactive:false
 * listforcustomer call).
 */
export type SumitCancelRecurringRequest = {
  Credentials: SumitCredentials
  Customer: { ID: number }
  RecurringCustomerItemID: number
}

export type SumitCancelRecurringResponse = {
  Status?: number
  UserErrorMessage?: string
  Data?: Record<string, never> | null
}

/**
 * Endpoint: POST /billing/paymentmethods/setforcustomer/
 * Sets/upserts a customer's default stored payment method — used to complete
 * an "update payment method" flow after capturing a fresh token via
 * /billing/payments/beginredirect/. Field names per the third-party SDK
 * (not independently live-tested — the underlying token capture and
 * beginredirect/get flows were tested, this specific call was not).
 */
export type SumitSetPaymentMethodRequest = {
  Credentials: SumitCredentials
  Customer: { ID: number }
  PaymentMethod: {
    CreditCard_Token: string
    CreditCard_ExpirationMonth: number
    CreditCard_ExpirationYear: number
    Type: 1
  }
}

export type SumitSetPaymentMethodResponse = {
  Status?: number
  UserErrorMessage?: string
}

/** Endpoint: POST /billing/payments/get/ */
export type SumitGetPaymentRequest = {
  Credentials: SumitCredentials
  PaymentID: number
}

export type SumitGetPaymentResponse = {
  Status?: number
  UserErrorMessage?: string
  Data?: {
    Payment?: SumitPaymentRecord
  }
}
