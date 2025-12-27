export interface LindaMessageData {
  name: string
  hours: number
  expectedHours: number
}

const messageTemplates = [
  ({ name, hours, expectedHours }: LindaMessageData) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #6366f1;">Čauky ${name}! 👋</h2>
      <p>Linda tady. Koukám do Clockify a zatím tam vidím jen <strong>${hours.toFixed(1)}h</strong> z očekávaných <strong>${expectedHours}h</strong> tento týden.</p>
      <p>Nezapomněl/a jsi něco zapsat? 🤔</p>
      <p>Třeba ti jen ujel vlak myšlenek a nestihla ses zapsat... nebo možná tajně pracuješ na vynálezu stroje času? ⏰</p>
      <p>Každopádně, Clockify na tebe čeká!</p>
      <p style="margin-top: 30px;">
        S láskou,<br/>
        <strong style="color: #6366f1;">Linda 💜</strong>
      </p>
    </div>
  `,

  ({ name, hours, expectedHours }: LindaMessageData) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #6366f1;">Hej ${name}! 😊</h2>
      <p>Tady Linda, tvoje oblíbená připomínačka.</p>
      <p>Všimla jsem si, že v Clockify svítí tento týden jen <strong>${hours.toFixed(1)}h</strong> (očekáváme tak ${expectedHours}h).</p>
      <p>Buď máš dovolenou (v tom případě pardon! 🏖️), nebo ti možná něco uniklo?</p>
      <p>Víkend je ideální čas si to doplnit, než to zapadne!</p>
      <p style="margin-top: 30px;">
        Drž se,<br/>
        <strong style="color: #6366f1;">Linda 🌸</strong>
      </p>
    </div>
  `,

  ({ name, hours, expectedHours }: LindaMessageData) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #6366f1;">Nazdar ${name}! 🙋</h2>
      <p>Linda hlásí ze služby!</p>
      <p>Clockify říká, že máš zatím <strong>${hours.toFixed(1)}h</strong> z ${expectedHours}h. To je trochu málo, ne?</p>
      <p>Možná jsi měl/a busy týden a prostě ses k tomu nedostal/a. Stává se! 😅</p>
      <p>Ale kdyby sis našel/la chvilku o víkendu, Clockify by ti byl vděčný. A já taky!</p>
      <p style="margin-top: 30px;">
        Měj se krásně,<br/>
        <strong style="color: #6366f1;">Linda ✨</strong>
      </p>
    </div>
  `,

  ({ name, hours, expectedHours }: LindaMessageData) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #6366f1;">Ahoj ${name}! 🌟</h2>
      <p>Tady tvoje virtuální kolegyně Linda.</p>
      <p>Prošla jsem Clockify a vidím tam pouze <strong>${hours.toFixed(1)} hodin</strong> z očekávaných ${expectedHours}h za tento týden.</p>
      <p>Vím, že zapisování času není zrovna nejzábavnější činnost na světě (věř mi, já to dělám pořád 😄), ale je to důležité!</p>
      <p>Tak až budeš mít chvilku, mrkni na to. Díky! 🙏</p>
      <p style="margin-top: 30px;">
        Zdraví,<br/>
        <strong style="color: #6366f1;">Linda 💫</strong>
      </p>
    </div>
  `,

  ({ name, hours, expectedHours }: LindaMessageData) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #6366f1;">Čus ${name}! 👀</h2>
      <p>Linda opět v akci!</p>
      <p>Dneska jsem si dala procházku po Clockify a u tebe svítí jen <strong>${hours.toFixed(1)}h</strong> (tento týden bychom čekali ${expectedHours}h).</p>
      <p>Buď jsi ninja, který pracuje v utajení 🥷, nebo jsi možná zapomněl/a něco zalogovat.</p>
      <p>Ať tak či tak, dej mi vědět (tedy... zapiš to do Clockify 😉)!</p>
      <p style="margin-top: 30px;">
        Tvoje věrná připomínačka,<br/>
        <strong style="color: #6366f1;">Linda 🦋</strong>
      </p>
    </div>
  `,
]

export function getRandomLindaMessage(data: LindaMessageData): string {
  const randomIndex = Math.floor(Math.random() * messageTemplates.length)
  return messageTemplates[randomIndex](data)
}

export function getEmailSubject(): string {
  const subjects = [
    "📝 Clockify ti posílá pozdrav!",
    "⏰ Linda tady - nezapomněl/a jsi na něco?",
    "👋 Malá připomínka od Lindy",
    "🕐 Clockify čeká na tvoje hodiny!",
    "💜 Linda se ptá: Co ten Clockify?",
  ]
  return subjects[Math.floor(Math.random() * subjects.length)]
}
