import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade | Visuno',
  description: 'Política de Privacidade e Termos de Uso do Visuno CRM.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background py-16 px-6 lg:px-8">
      <div className="max-w-3xl mx-auto prose prose-slate dark:prose-invert">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Política de Privacidade</h1>
        <p className="text-muted-foreground mb-8">
          Última atualização: 16 de Julho de 2026
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Introdução</h2>
          <p>
            Bem-vindo ao Visuno CRM. A sua privacidade é muito importante para nós. Esta Política de
            Privacidade descreve como coletamos, usamos, protegemos e compartilhamos as suas
            informações pessoais quando você utiliza a nossa plataforma e os nossos serviços de
            integração com o WhatsApp Business API.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Coleta de Dados e Uso do WhatsApp</h2>
          <p>
            Ao conectar a sua conta do WhatsApp Business ao Visuno CRM através do Facebook Login (Embedded Signup) ou fornecendo o seu Token Oficial, nós coletamos e armazenamos as seguintes informações para permitir o funcionamento da plataforma:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li><strong>Identificadores do WhatsApp:</strong> Como o <code>phone_number_id</code> e o <code>waba_id</code> da sua empresa.</li>
            <li><strong>Tokens de Acesso:</strong> Armazenamos de forma segura os tokens gerados pela Meta para podermos enviar e receber mensagens em nome da sua empresa.</li>
            <li><strong>Mensagens e Contatos:</strong> Para fornecer a funcionalidade de CRM, as mensagens enviadas e recebidas pelos seus clientes através do WhatsApp são processadas e armazenadas em nossos servidores criptografados.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Como Protegemos as suas Informações</h2>
          <p>
            Nós adotamos as melhores práticas de segurança da informação para proteger os seus dados.
            Todos os tokens de acesso à API da Meta são criptografados no banco de dados. Nós não
            compartilhamos, não vendemos e não alugamos as informações dos seus clientes para
            nenhuma empresa terceira.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Retenção e Exclusão de Dados</h2>
          <p>
            Você tem controle total sobre os dados da sua empresa no Visuno CRM.
            A qualquer momento, você pode:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Desconectar o seu número do WhatsApp da nossa plataforma;</li>
            <li>Excluir permanentemente o seu espaço de trabalho e todos os históricos de conversas através do painel de configurações;</li>
            <li>Revogar as permissões do aplicativo Visuno CRM diretamente na sua conta do Facebook (Meta Business Manager).</li>
          </ul>
          <p className="mt-4">
            Após a exclusão, todos os dados relacionados ao seu WhatsApp serão apagados de nossos
            servidores de forma irreversível.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Conformidade com a Meta e LGPD</h2>
          <p>
            O Visuno CRM atua em estrita conformidade com os Termos de Serviço do WhatsApp Business e com a Lei Geral de Proteção de Dados (LGPD) do Brasil. Nós atuamos como Operadores de Dados das mensagens que você (Controlador de Dados) troca com os seus clientes.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Contato</h2>
          <p>
            Se você tiver qualquer dúvida sobre esta Política de Privacidade ou sobre o tratamento
            dos seus dados, entre em contato conosco através do e-mail: <strong>contato@visuno.com</strong>
          </p>
        </section>
        
        <div className="mt-12 pt-8 border-t text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Visuno Tecnologia. Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
}
