const fs = require('fs');
let content = fs.readFileSync('src/components/flows/forms/node-config-form.tsx', 'utf8');

const varsCalc = `  const t = useTranslations("Flows.builder.form");

  const availableVarsSet = new Set(["contact.name", "contact.phone"]);
  let hasAppointment = false;
  for (const n of allNodes) {
    if (n.config?.var_key) availableVarsSet.add(n.config.var_key);
    if (n.config?.variable_name) availableVarsSet.add(n.config.variable_name);
    if (n.node_type === "appointment") hasAppointment = true;
  }
  if (hasAppointment) {
    availableVarsSet.add("agendamento_data");
    availableVarsSet.add("agendamento_hora");
  }
  const availableVars = Array.from(availableVarsSet);`;

content = content.replace('  const t = useTranslations("Flows.builder.form");', varsCalc);
content = content.replaceAll('<TextRow', '<TextRow availableVars={availableVars}');
fs.writeFileSync('src/components/flows/forms/node-config-form.tsx', content);
