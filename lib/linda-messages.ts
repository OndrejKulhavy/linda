export interface LindaMessageData {
  name: string
  hours: number
  expectedHours: number
}

const PRIMARY_COLOR = "#0ea5e9" // Light blue (Tuuli color)

const messageTemplates = [
  ({ name, hours, expectedHours }: LindaMessageData) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; padding: 20px;">
      <h2 style="color: ${PRIMARY_COLOR};">Čauky ${name}! 👋</h2>
      <p>Linda z Tuuli tady. Koukám do Clockify a zatím tam vidím jen <strong>${hours.toFixed(1)}h</strong> z očekávaných <strong>${expectedHours}h</strong> tento týden.</p>
      <p>Nezapomněl/a jsi něco zapsat? 🤔</p>
      <p>Třeba ti jen ujel vlak myšlenek a nestihla ses zapsat... nebo možná tajně pracuješ na vynálezu stroje času? ⏰</p>
      <p>Každopádně, Clockify na tebe čeká!</p>
      <p style="margin-top: 30px;">
        S láskou,<br/>
        <strong style="color: ${PRIMARY_COLOR};">Linda z Tuuli 💙</strong>
      </p>
    </div>
  `,

  ({ name, hours, expectedHours }: LindaMessageData) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; padding: 20px;">
      <h2 style="color: ${PRIMARY_COLOR};">Hej ${name}! 😊</h2>
      <p>Tady Linda z Tuuli, tvoje oblíbená připomínačka.</p>
      <p>Všimla jsem si, že v Clockify svítí tento týden jen <strong>${hours.toFixed(1)}h</strong> (očekáváme tak ${expectedHours}h).</p>
      <p>Buď máš dovolenou (v tom případě pardon! 🏖️), nebo ti možná něco uniklo?</p>
      <p>Víkend je ideální čas si to doplnit, než to zapadne!</p>
      <p style="margin-top: 30px;">
        Drž se,<br/>
        <strong style="color: ${PRIMARY_COLOR};">Linda z Tuuli 🌊</strong>
      </p>
    </div>
  `,

  ({ name, hours, expectedHours }: LindaMessageData) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; padding: 20px;">
      <h2 style="color: ${PRIMARY_COLOR};">Nazdar ${name}! 🙋</h2>
      <p>Linda z Tuuli hlásí ze služby!</p>
      <p>Clockify říká, že máš zatím <strong>${hours.toFixed(1)}h</strong> z ${expectedHours}h. To je trochu málo, ne?</p>
      <p>Možná jsi měl/a busy týden a prostě ses k tomu nedostal/a. Stává se! 😅</p>
      <p>Ale kdyby sis našel/la chvilku o víkendu, Clockify by ti byl vděčný. A já taky!</p>
      <p style="margin-top: 30px;">
        Měj se krásně,<br/>
        <strong style="color: ${PRIMARY_COLOR};">Linda z Tuuli ✨</strong>
      </p>
    </div>
  `,

  ({ name, hours, expectedHours }: LindaMessageData) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; padding: 20px;">
      <h2 style="color: ${PRIMARY_COLOR};">Ahoj ${name}! 🌟</h2>
      <p>Tady tvoje virtuální kolegyně Linda z Tuuli.</p>
      <p>Prošla jsem Clockify a vidím tam pouze <strong>${hours.toFixed(1)} hodin</strong> z očekávaných ${expectedHours}h za tento týden.</p>
      <p>Vím, že zapisování času není zrovna nejzábavnější činnost na světě (věř mi, já to dělám pořád 😄), ale je to důležité!</p>
      <p>Tak až budeš mít chvilku, mrkni na to. Díky! 🙏</p>
      <p style="margin-top: 30px;">
        Zdraví,<br/>
        <strong style="color: ${PRIMARY_COLOR};">Linda z Tuuli 💙</strong>
      </p>
    </div>
  `,

  ({ name, hours, expectedHours }: LindaMessageData) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; padding: 20px;">
      <h2 style="color: ${PRIMARY_COLOR};">Čus ${name}! 👀</h2>
      <p>Linda z Tuuli opět v akci!</p>
      <p>Dneska jsem si dala procházku po Clockify a u tebe svítí jen <strong>${hours.toFixed(1)}h</strong> (tento týden bychom čekali ${expectedHours}h).</p>
      <p>Buď jsi ninja, který pracuje v utajení 🥷, nebo jsi možná zapomněl/a něco zalogovat.</p>
      <p>Ať tak či tak, dej mi vědět (tedy... zapiš to do Clockify 😉)!</p>
      <p style="margin-top: 30px;">
        Tvoje věrná připomínačka,<br/>
        <strong style="color: ${PRIMARY_COLOR};">Linda z Tuuli 🦋</strong>
      </p>
    </div>
  `,

  ({ name, hours, expectedHours }: LindaMessageData) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; padding: 20px;">
      <h2 style="color: ${PRIMARY_COLOR};">Zdarec ${name}! 🎯</h2>
      <p>Linda z Tuuli na příjmu!</p>
      <p>Hele, nechci být otravná, ale... <strong>${hours.toFixed(1)}h</strong> z ${expectedHours}h? To je jak jít na pizzu a sníst jen okraj! 🍕</p>
      <p>Určitě jsi toho udělal/a víc, jen to tam není zapsané, že jo?</p>
      <p>Hoď to tam, ať máme všichni klid! 😌</p>
      <p style="margin-top: 30px;">
        Drž se,<br/>
        <strong style="color: ${PRIMARY_COLOR};">Linda z Tuuli 🍕</strong>
      </p>
    </div>
  `,

  ({ name, hours, expectedHours }: LindaMessageData) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; padding: 20px;">
      <h2 style="color: ${PRIMARY_COLOR};">Hola ${name}! 🌴</h2>
      <p>Tvoje Linda z Tuuli se hlásí s pravidelnou kontrolou!</p>
      <p>V Clockify máš aktuálně <strong>${hours.toFixed(1)}h</strong>, ale čekali bychom spíš něco kolem ${expectedHours}h.</p>
      <p>Neříkám, že musíš hned běžet k počítači... ale třeba až dopíješ kafe? ☕</p>
      <p>Díky moc! 🙌</p>
      <p style="margin-top: 30px;">
        S pozdravem,<br/>
        <strong style="color: ${PRIMARY_COLOR};">Linda z Tuuli ☕</strong>
      </p>
    </div>
  `,

  ({ name, hours, expectedHours }: LindaMessageData) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; padding: 20px;">
      <h2 style="color: ${PRIMARY_COLOR};">Servus ${name}! 🎪</h2>
      <p>Linda z Tuuli volá z Clockify centrály!</p>
      <p>Podle mých super přesných výpočtů (AI nepočítá, AI ví 🤖) ti chybí nějaké hodiny.</p>
      <p>Máš tam <strong>${hours.toFixed(1)}h</strong>, ale týden má normálně ${expectedHours}h práce.</p>
      <p>Neboj, nestane se nic zlého, jen mi udělej radost a doplň to! 🥹</p>
      <p style="margin-top: 30px;">
        Tvá digitální kamarádka,<br/>
        <strong style="color: ${PRIMARY_COLOR};">Linda z Tuuli 🤖</strong>
      </p>
    </div>
  `,

  ({ name, hours, expectedHours }: LindaMessageData) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; padding: 20px;">
      <h2 style="color: ${PRIMARY_COLOR};">Jooo ${name}! 🎸</h2>
      <p>Linda z Tuuli přichází s breaking news!</p>
      <p>Tvůj Clockify vypadá trochu... prázdně? 😬</p>
      <p><strong>${hours.toFixed(1)}h</strong> ze ${expectedHours}h je jako mít playlist s jednou písničkou na repeat.</p>
      <p>Přidej tam něco, ať to žije! 🎵</p>
      <p style="margin-top: 30px;">
        Rock on,<br/>
        <strong style="color: ${PRIMARY_COLOR};">Linda z Tuuli 🎸</strong>
      </p>
    </div>
  `,

  ({ name, hours, expectedHours }: LindaMessageData) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; padding: 20px;">
      <h2 style="color: ${PRIMARY_COLOR};">Čauves ${name}! 🚀</h2>
      <p>Linda z Tuuli reporting for duty!</p>
      <p>Tak jsem se dívala na tvůj Clockify a... no... <strong>${hours.toFixed(1)}h</strong>? Vážně? 🧐</p>
      <p>Chápu, že ${expectedHours}h je ambiciózní cíl, ale věřím v tebe!</p>
      <p>Stačí otevřít Clockify a pustit se do toho. Easy peasy! 🍋</p>
      <p style="margin-top: 30px;">
        Fandím ti,<br/>
        <strong style="color: ${PRIMARY_COLOR};">Linda z Tuuli 🚀</strong>
      </p>
    </div>
  `,

  ({ name, hours, expectedHours }: LindaMessageData) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; padding: 20px;">
      <h2 style="color: ${PRIMARY_COLOR};">Zdravím ${name}! 🌈</h2>
      <p>Tady Linda z Tuuli s přátelskou připomínkou!</p>
      <p>Wanna hear a joke? Tvůj Clockify tento týden! 😂</p>
      <p>Ne vážně, <strong>${hours.toFixed(1)}h</strong> z ${expectedHours}h je trochu málo. Ale klid, ještě je čas to napravit!</p>
      <p>Dej tam ty hodiny a můžeš si užít zbytek víkendu bez výčitek! 🎉</p>
      <p style="margin-top: 30px;">
        Cheers,<br/>
        <strong style="color: ${PRIMARY_COLOR};">Linda z Tuuli 🌈</strong>
      </p>
    </div>
  `,

  ({ name, hours, expectedHours }: LindaMessageData) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; padding: 20px;">
      <h2 style="color: ${PRIMARY_COLOR};">Haló ${name}! 📞</h2>
      <p>Linda z Tuuli na lince!</p>
      <p>Volám ti, protože Clockify mi pošeptal, že máš jen <strong>${hours.toFixed(1)}h</strong> tento týden.</p>
      <p>A já jsem taková, že ${expectedHours}h by bylo fajn, ne? 🤷‍♀️</p>
      <p>Takže až budeš mít minutku, mrkni na to. Clockify tě potřebuje! 💪</p>
      <p style="margin-top: 30px;">
        Končím hovor,<br/>
        <strong style="color: ${PRIMARY_COLOR};">Linda z Tuuli 📞</strong>
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
    "⏰ Linda z Tuuli - nezapomněl/a jsi na něco?",
    "👋 Malá připomínka od Lindy z Tuuli",
    "🕐 Clockify čeká na tvoje hodiny!",
    "💙 Linda z Tuuli se ptá: Co ten Clockify?",
    "🌊 Tuuli reminder: Hodiny v Clockify!",
    "🎯 Linda z Tuuli: Quick check-in!",
    "⚡ Clockify update needed!",
    "🤖 Linda z Tuuli má pro tebe zprávu",
    "📊 Tvůj týdenní Clockify status",
  ]
  return subjects[Math.floor(Math.random() * subjects.length)]
}
