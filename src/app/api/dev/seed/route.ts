import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();

  // No ambiente DEV, vamos apenas pegar a primeira conta do banco para injetar os dados
  const { data: accounts } = await supabase.from('accounts').select('id, owner_user_id').limit(1);
  
  if (!accounts || accounts.length === 0) {
    return NextResponse.json({ error: "Nenhuma conta encontrada no banco. Faça login pelo menos uma vez." }, { status: 400 });
  }

  const finalAccountId = accounts[0].id;
  const userId = accounts[0].owner_user_id;

  try {
    // 1. Criar Contatos Fictícios de Alto Padrão (E espalhar as datas de criação nos últimos 30 dias para o gráfico)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const fakeContacts = [
      { user_id: userId, account_id: finalAccountId, name: "João Silva - TechCorp", phone: "5511999990001", company: "TechCorp Inc", created_at: thirtyDaysAgo.toISOString() },
      { user_id: userId, account_id: finalAccountId, name: "Maria Souza - FinServ", phone: "5511999990002", company: "FinServ Capital", created_at: fifteenDaysAgo.toISOString() },
      { user_id: userId, account_id: finalAccountId, name: "Carlos Andrade - Global", phone: "5511999990003", company: "Global Solutions", created_at: yesterday.toISOString() },
      { user_id: userId, account_id: finalAccountId, name: "Ana Beatriz - StartUp", phone: "5511999990004", company: "StartUp Lab", created_at: new Date().toISOString() },
      { user_id: userId, account_id: finalAccountId, name: "Felipe Costa", phone: "5511999990005", created_at: new Date().toISOString() },
      // Mais contatos antigos para encher o gráfico "Clientes em Risco" e "Para reativar"
      { user_id: userId, account_id: finalAccountId, name: "Cliente Antigo 1", phone: "5511999990006", created_at: thirtyDaysAgo.toISOString() },
      { user_id: userId, account_id: finalAccountId, name: "Cliente Antigo 2", phone: "5511999990007", created_at: thirtyDaysAgo.toISOString() },
    ];

    // APAGAR FAKES ANTIGOS PARA NÃO DAR ERRO DE DUPLICADO
    await supabase.from('contacts').delete().like('phone', '551199999%');
    await supabase.from('sales').delete().eq('account_id', finalAccountId);
    await supabase.from('automations').delete().eq('account_id', finalAccountId);
    await supabase.from('appointments').delete().eq('account_id', finalAccountId);

    const { data: insertedContacts, error: contactsError } = await supabase
      .from('contacts')
      .insert(fakeContacts)
      .select('id, name, phone');

    if (contactsError) throw contactsError;

    // Criar Vendas Fechadas (Analytics de Produtos e Receita Recuperada)
    // 10 Produtos variados para lotar o Analytics
    const fakeProducts = [
      { account_id: finalAccountId, user_id: userId, name: "Consultoria Premium", price: 15000, unit: "un", active: true },
      { account_id: finalAccountId, user_id: userId, name: "Implantação de Software", price: 35000, unit: "un", active: true },
      { account_id: finalAccountId, user_id: userId, name: "Plano Enterprise Anual", price: 12000, unit: "un", active: true },
      { account_id: finalAccountId, user_id: userId, name: "Mentoria de Equipes", price: 5000, unit: "un", active: true },
      { account_id: finalAccountId, user_id: userId, name: "Auditoria de Processos", price: 18000, unit: "un", active: true },
      { account_id: finalAccountId, user_id: userId, name: "Licenciamento Starter", price: 2500, unit: "un", active: true },
      { account_id: finalAccountId, user_id: userId, name: "Setup Inicial", price: 1000, unit: "un", active: true },
      { account_id: finalAccountId, user_id: userId, name: "Suporte 24/7 (Anual)", price: 8000, unit: "un", active: true },
      { account_id: finalAccountId, user_id: userId, name: "Treinamento Presencial", price: 9500, unit: "un", active: true },
      { account_id: finalAccountId, user_id: userId, name: "Módulo de IA Adicional", price: 4000, unit: "un", active: true },
    ];
    await supabase.from('products').delete().eq('account_id', finalAccountId); // limpar antigos
    const { data: insertedProducts } = await supabase.from('products').insert(fakeProducts).select('id, price');

    if (insertedProducts && insertedProducts.length === 10) {
      // Injetar ~60 vendas espalhadas pelos últimos 30 dias para gerar o gráfico
      const fakeSales = [];
      const fakeSalesItems = [];
      
      for (let i = 0; i < 60; i++) {
        const randomDaysAgo = Math.floor(Math.random() * 30);
        const date = new Date();
        date.setDate(date.getDate() - randomDaysAgo);
        
        const randomProduct = insertedProducts[Math.floor(Math.random() * insertedProducts.length)];
        const qty = Math.floor(Math.random() * 3) + 1; // de 1 a 3
        const total = randomProduct.price * qty;

        fakeSales.push({
          account_id: finalAccountId,
          user_id: userId,
          contact_id: insertedContacts![i % insertedContacts!.length].id,
          total_value: total,
          created_at: date.toISOString(),
          updated_at: date.toISOString()
        });
      }
      
      const { data: salesData } = await supabase.from('sales').insert(fakeSales).select('id, total_value');
      
      if (salesData) {
        for (let i = 0; i < salesData.length; i++) {
          const randomProduct = insertedProducts[Math.floor(Math.random() * insertedProducts.length)];
          fakeSalesItems.push({
            sale_id: salesData[i].id,
            product_id: randomProduct.id,
            quantity: 1,
            unit_price: randomProduct.price,
            total_value: randomProduct.price,
            // Conserta as datas do gráfico de Faturamento Diário
            created_at: fakeSales[i].created_at
          });
        }
        await supabase.from('sales_items').insert(fakeSalesItems);
      }
    }

    // Adicionar Histórico Falso de Automações (Para lotar o canto superior direito)
    const fakeAutomations = [
      { account_id: finalAccountId, user_id: userId, name: "Reativação VIP", trigger_type: "inactivity", trigger_config: {}, is_active: true, execution_count: 145 },
      { account_id: finalAccountId, user_id: userId, name: "Boas Vindas", trigger_type: "new_contact_created", trigger_config: {}, is_active: true, execution_count: 890 },
    ];
    await supabase.from('automations').insert(fakeAutomations);

    // 2. Injetar Negócios no Pipeline (se houver Pipeline)
    const { data: pipelines } = await supabase.from('pipelines').select('id').eq('account_id', finalAccountId).limit(1);
    if (pipelines && pipelines.length > 0) {
      const pipelineId = pipelines[0].id;
      const { data: stages } = await supabase.from('pipeline_stages').select('id, name').eq('pipeline_id', pipelineId);
      
      if (stages && stages.length >= 3) {
        // Apagar negócios antigos para não duplicar infinitamente
        await supabase.from('deals').delete().eq('pipeline_id', pipelineId);

        const fakeDeals = [];
        const companyNames = [
          "TechCorp Inc", "FinServ Capital", "Global Solutions", "StartUp Lab", "MegaStore",
          "AlphaTech", "BetaFinance", "DeltaLogistics", "EchoMarketing", "ZetaSoftware",
          "OmegaIndústria", "SigmaConsulting", "NexusCorp", "AuraHealth", "VanguardEdu",
          "ApexDesign", "PinnacleSystems", "SummitRetail", "CrestTelecom", "VertexEnergy",
          "NovaBuilders", "StellarMedia", "OrionSecurity", "LyraTransport", "CygnusFoods",
          "DracoEntertainment", "LyraLegal", "HydraAgri", "PhoenixEvents", "PegasusTravel"
        ];
        
        for (let i = 0; i < 30; i++) {
          const randomStage = stages[Math.floor(Math.random() * stages.length)];
          const randomValue = Math.floor(Math.random() * 50000) + 5000; // Entre 5k e 55k
          
          fakeDeals.push({
            user_id: userId,
            pipeline_id: pipelineId,
            stage_id: randomStage.id,
            contact_id: insertedContacts![i % insertedContacts!.length].id,
            title: `${companyNames[i]} - Negociação`,
            value: randomValue,
            currency: 'BRL', // Forçar a moeda para real na base de dados
            account_id: finalAccountId,
            status: 'open'
          });
        }
        
        // Adicionar negócios Ganhos e Perdidos para lotar as estatísticas de "Ganhei/Perdi esse mês"
        for (let i = 0; i < 15; i++) {
          fakeDeals.push({
            user_id: userId,
            pipeline_id: pipelineId,
            stage_id: stages[stages.length - 1].id,
            contact_id: insertedContacts![i % insertedContacts!.length].id,
            title: `Venda B2B Fechada #${i}`,
            value: Math.floor(Math.random() * 80000) + 10000,
            currency: 'BRL',
            account_id: finalAccountId,
            status: i < 10 ? 'won' : 'lost',
            // Usa updated_at / created_at gerados automaticamente
          });
        }
        
        await supabase.from('deals').insert(fakeDeals);
      }
    }
    
    // Atualizar TODAS as outras empresas que já existiam para Real também
    await supabase.from('deals').update({ currency: 'BRL' }).eq('account_id', finalAccountId);

    // 3. Criar Conversas e Mensagens
    for (let i = 0; i < 3; i++) {
      const contact = insertedContacts![i];
      const { data: convData, error: convErr } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          account_id: finalAccountId,
          contact_id: contact.id,
          status: 'open',
          unread_count: 1,
          last_message_text: "Excelente, vamos fechar negócio!",
          last_message_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (!convErr && convData) {
        // Mensagens simulando negociação
        await supabase.from('messages').insert([
          { conversation_id: convData.id, sender_type: 'customer', content_type: 'text', content_text: `Olá, vi a apresentação da solução e gostei bastante.`, status: 'read' },
          { conversation_id: convData.id, sender_type: 'agent', sender_id: userId, content_type: 'text', content_text: `Que ótimo, ${contact.name.split(' ')[0]}! Podemos marcar uma rápida reunião para ajustar os detalhes do contrato?`, status: 'delivered' },
          { conversation_id: convData.id, sender_type: 'customer', content_type: 'text', content_text: `Excelente, vamos fechar negócio!`, status: 'delivered' },
        ]);
      }
    }

    // 4. Agenda (Appointments)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Começo de hoje
    
    // Pegar todos os funcionários dessa conta para lotar a view de "Dia"
    const { data: members } = await supabase.from('profiles').select('user_id').eq('account_id', finalAccountId);
    const memberIds = members && members.length > 0 ? members.map(m => m.user_id) : [userId];

    const fakeAppointments = [];
    const appointmentNotes = [
      "Apresentação TechCorp", "Fechamento Contrato", "Alinhamento Inicial",
      "Demonstração do Sistema", "Revisão de Proposta", "Call de Suporte",
      "Mentoria de Equipe", "Onboarding de Cliente", "[Agendado via WhatsApp] Reunião",
      "Follow-up de Vendas", "Planejamento Estratégico", "Discussão de Valores"
    ];

    // Gerar 35 agendamentos espalhados de Segunda a Sexta da SEMANA ATUAL
    const dayOfWeek = today.getDay(); // 0 é domingo, 1 é segunda...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() + diffToMonday);

    for (let i = 0; i < 35; i++) {
      const randomDayOffset = Math.floor(Math.random() * 5); // 0 (Seg) a 4 (Sex)
      const hour = Math.floor(Math.random() * 10) + 8; // 8h às 17h
      
      const apptDate = new Date(currentMonday);
      apptDate.setDate(currentMonday.getDate() + randomDayOffset);
      apptDate.setHours(hour, 0, 0, 0); 
      
      const endTime = new Date(apptDate);
      endTime.setHours(hour + 1);

      fakeAppointments.push({
        account_id: finalAccountId,
        contact_id: insertedContacts![i % insertedContacts!.length].id,
        assignee_id: memberIds[i % memberIds.length], // Dividir igualmente entre Josué, Igor, Bruna, etc
        status: "scheduled",
        notes: appointmentNotes[i % appointmentNotes.length],
        start_time: apptDate.toISOString(),
        end_time: endTime.toISOString()
      });
    }

    await supabase.from('appointments').insert(fakeAppointments);

    return NextResponse.json({ success: true, message: "Dados injetados com sucesso! Vá nas páginas e tire os prints!" });

  } catch (err: any) {
    console.error("ERRO NO SEED:", err);
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
