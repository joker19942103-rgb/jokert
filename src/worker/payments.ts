// No imports needed for now

export async function createPayment(db: D1Database, userId: number, amount: number): Promise<any> {
  const result = await db.prepare(`
    INSERT INTO payments (user_id, amount, status)
    VALUES (?, ?, 'pending')
  `).bind(userId, amount).run();

  if (!result.success) {
    throw new Error("Failed to create payment");
  }

  return getPaymentById(db, result.meta.last_row_id as number);
}

export async function getPaymentById(db: D1Database, id: number): Promise<any> {
  const payment = await db.prepare(`
    SELECT * FROM payments WHERE id = ?
  `).bind(id).first();

  if (!payment) {
    throw new Error("Payment not found");
  }

  return payment;
}

export async function getUserPayments(db: D1Database, userId: number): Promise<any[]> {
  const result = await db.prepare(`
    SELECT * FROM payments 
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).bind(userId).all();

  return result.results;
}

export async function getAllPayments(db: D1Database): Promise<any[]> {
  const result = await db.prepare(`
    SELECT p.*, u.name as user_name, u.email as user_email
    FROM payments p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.created_at DESC
  `).all();

  return result.results as any[];
}

export async function confirmPayment(db: D1Database, paymentId: number, adminId: number): Promise<void> {
  // Update payment status
  await db.prepare(`
    UPDATE payments 
    SET status = 'confirmed', confirmed_by_admin_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(adminId, paymentId).run();

  // Get payment to find user
  const payment = await getPaymentById(db, paymentId);
  
  // Update user payment status
  await db.prepare(`
    UPDATE users 
    SET is_payment_confirmed = true, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(payment.user_id).run();
}
