// Serviço de email para convites
export interface EmailInviteData {
  to: string;
  accountName: string;
  inviterName: string;
  inviteLink: string;
  role: string;
}

export async function sendInviteEmail(data: EmailInviteData) {
  // Para desenvolvimento, vamos simular o envio de email
  // Em produção, você pode integrar com SendGrid, Resend, ou outro serviço
  
  const emailContent = {
    to: data.to,
    subject: `Convite para participar da conta "${data.accountName}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Você foi convidado para uma conta!</h2>
        
        <p>Olá!</p>
        
        <p><strong>${data.inviterName}</strong> convidou você para participar da conta <strong>"${data.accountName}"</strong> como <strong>${data.role === 'owner' ? 'Proprietário' : 'Membro'}</strong>.</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">O que você pode fazer:</h3>
          <ul>
            <li>Visualizar transações da conta</li>
            <li>Adicionar novas transações</li>
            <li>Ver relatórios e gráficos</li>
            <li>Gerenciar categorias</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.inviteLink}" 
             style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Aceitar Convite
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          Se você não quiser participar desta conta, pode simplesmente ignorar este email.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #9ca3af; font-size: 12px;">
          Este convite foi enviado através do FinControl. Se você não esperava este convite, pode ignorar este email.
        </p>
      </div>
    `
  };
  
  // Simular envio de email (em produção, integrar com serviço real)
  console.log("📧 Email de convite simulado:", emailContent);
  
  // Salvar no localStorage para simular recebimento
  const emailInvites = JSON.parse(localStorage.getItem("email_invites") || "[]");
  emailInvites.push({
    id: `email_${Date.now()}`,
    to: data.to,
    accountName: data.accountName,
    inviterName: data.inviterName,
    role: data.role,
    inviteLink: data.inviteLink,
    status: "pending",
    createdAt: new Date().toISOString()
  });
  localStorage.setItem("email_invites", JSON.stringify(emailInvites));
  
  return { success: true, message: "Email enviado com sucesso!" };
}
