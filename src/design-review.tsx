import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Dumbbell,
  CalendarDays,
  LayoutGrid,
  UserRound,
  ArrowUpRight,
  ChevronRight,
  Building2,
  Users,
  ClipboardCheck,
  MessageSquare,
} from "lucide-react";
import "./index.css";
import {
  PageIntro,
  LivingMark,
  SectionHeading,
} from "./components/visual/LivingIdentity";
import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import { MetCard } from "./components/warroom/MetCard";
const config = {
  morador: {
    title: "Seu próximo movimento.",
    eyebrow: "Olá, Marina",
    description: "Treino, cuidado e bem-estar. Tudo a poucos passos de casa.",
    nav: ["Hoje", "Treino", "Agenda", "Mais"],
  },
  coach: {
    title: "Orientar. Acompanhar. Evoluir.",
    eyebrow: "Coach · Nine Living",
    description:
      "Uma visão clara de quem precisa de atenção e do próximo passo de cada atendimento.",
    nav: ["Atendimentos", "Moradores", "Agenda", "Biblioteca"],
  },
  sindico: {
    title: "Seu condomínio em movimento.",
    eyebrow: "Seu condomínio · visão geral",
    description:
      "Acompanhe a rotina, organize os encontros e cuide do que precisa de atenção.",
    nav: ["Meu condomínio", "Eventos", "Comunicação", "Atendimento"],
  },
  admin: {
    title: "Uma operação bem cuidada.",
    eyebrow: "Administração · Nine Living",
    description:
      "Condomínios, pessoas e os próximos passos. Uma visão clara para fazer acontecer.",
    nav: ["Visão geral", "Condomínios", "Pessoas", "Operação"],
  },
};
function Review() {
  const [persona, setPersona] = useState<keyof typeof config>("morador");
  const c = config[persona];
  const icons = [LayoutGrid, Dumbbell, CalendarDays, UserRound];
  return (
    <div className="nl-shell">
      <div className="flex flex-wrap items-center justify-center gap-2 border-b bg-white px-4 py-2 text-xs">
        <span className="mr-3 text-muted-foreground">
          Prévia de direção visual · dados ilustrativos
        </span>
        {Object.keys(config).map((p) => (
          <button
            key={p}
            aria-pressed={persona === p}
            className={
              "rounded-full px-3 py-1 font-semibold " +
              (persona === p ? "bg-primary text-white" : "text-primary")
            }
            onClick={() => setPersona(p as any)}
          >
            {p === "sindico"
              ? "Síndico"
              : p === "admin"
                ? "Admin"
                : p === "coach"
                  ? "Coach"
                  : "Morador"}
          </button>
        ))}
      </div>
      <header className="nl-topbar">
        <div className="nl-topbar-inner">
          <div className="flex items-center gap-3">
            <LivingMark />
            <div>
              <p className="nl-wordmark">NINE LIVING</p>
              <p className="nl-brand-caption">Saúde · Movimento · Comunidade</p>
              <p className="nl-context-name">Condomínio Jardim das Oliveiras</p>
            </div>
          </div>
          <div className="nl-account flex items-center gap-3">
            <span className="nl-persona-label">
              {persona === "sindico"
                ? "Síndico"
                : persona === "coach"
                  ? "Coach"
                  : persona === "admin"
                    ? "Admin"
                    : "Morador"}
            </span>
            <Button variant="ghost" size="sm">
              Minha conta <UserRound />
            </Button>
          </div>
        </div>
        <nav className="nl-navigation" aria-label="Prévia da navegação">
          <div className="nl-nav-track">
            {c.nav.map((label, i) => {
              const Icon = icons[i];
              return (
                <button
                  className="nl-nav-link"
                  key={label}
                  aria-current={i === 0 ? "page" : undefined}
                >
                  <Icon />
                  {label}
                </button>
              );
            })}
          </div>
        </nav>
      </header>
      <main className="nl-content">
        <PageIntro
          key={persona}
          eyebrow={c.eyebrow}
          title={c.title}
          description={c.description}
          actions={
            persona === "morador" ? (
              <Button>
                Abrir meu treino <ArrowUpRight />
              </Button>
            ) : (
              <Button>
                Ver próximos passos <ArrowUpRight />
              </Button>
            )
          }
        />
        {persona === "morador" ? (
          <>
            <SectionHeading
              eyebrow="Seu dia, com intenção"
              title="Tudo pronto para começar."
              action={
                <span className="hidden text-xs text-muted-foreground sm:block">
                  Quarta-feira · 11 de novembro
                </span>
              }
            />
            <div className="grid items-stretch gap-5 lg:grid-cols-[1.5fr_1fr]">
              <Card>
                <CardContent className="space-y-6 p-6 sm:p-8">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-secondary px-3 py-1 text-[10px] font-bold tracking-wider text-primary">
                      SEU TREINO
                    </span>
                    <Dumbbell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-display text-3xl">
                      Força para a sua rotina.
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Treino de força · Orientação do seu coach
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-6 border-y py-4">
                    <div>
                      <strong className="text-xl font-semibold">6</strong>
                      <p className="text-xs text-muted-foreground">
                        exercícios
                      </p>
                    </div>
                    <div>
                      <strong className="text-xl font-semibold">Hoje</strong>
                      <p className="text-xs text-muted-foreground">
                        sessão programada
                      </p>
                    </div>
                  </div>
                  <Button className="w-full justify-between" size="lg">
                    Começar meu treino <ArrowUpRight />
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="space-y-5 p-6 sm:p-8">
                  <div className="flex items-center justify-between">
                    <span className="nl-eyebrow text-muted-foreground">
                      Sua próxima aula
                    </span>
                    <CalendarDays className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="font-display text-4xl">
                      18<span className="text-2xl">h30</span>
                    </span>
                    <h2 className="mt-3 text-lg font-semibold">
                      Mobilidade e equilíbrio
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Amanhã · Espaço de movimento
                    </p>
                  </div>
                  <p className="rounded-xl bg-secondary p-3 text-xs text-primary">
                    Inscrição confirmada
                  </p>
                  <Button variant="outline" className="w-full justify-between">
                    Ver minha agenda <ChevronRight />
                  </Button>
                </CardContent>
              </Card>
            </div>
            <SectionHeading
              eyebrow="Viver bem, por perto"
              title="Seu condomínio, mais próximo."
            />
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["Academia", "Infraestrutura e horários", Dumbbell],
                ["Seus encontros", "Aulas e eventos", CalendarDays],
                ["Sua equipe", "Orientação e apoio", Users],
              ].map(([title, desc, Icon]: any) => (
                <Card key={title}>
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="rounded-xl bg-secondary p-3 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">{title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {desc}
                      </p>
                    </div>
                    <ArrowUpRight className="ml-auto h-4 w-4 text-primary" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <>
            <SectionHeading
              eyebrow="Uma visão clara"
              title={
                persona === "coach"
                  ? "Cada atendimento, um próximo passo."
                  : "A rotina em perspectiva."
              }
            />
            <div className="grid gap-4 sm:grid-cols-3">
              {(persona === "coach"
                ? [
                    ["Moradores em acompanhamento", 24],
                    ["Avaliações para revisar", 3],
                    ["Encontros nesta semana", 8],
                  ]
                : persona === "sindico"
                  ? [
                      ["Pessoas vinculadas", 42],
                      ["Unidades com moradores", 31],
                      ["Sessões completas no mês", 86],
                    ]
                  : [
                      ["Condomínios cadastrados", 12],
                      ["Pessoas vinculadas", 268],
                      ["Pendências operacionais", 4],
                    ]
              ).map(([label, value]) => (
                <MetCard key={label} label={String(label)} value={value} />
              ))}
            </div>
            <SectionHeading
              eyebrow="Atenção ao que importa"
              title="Próximos passos"
            />
            <Card>
              <CardContent className="divide-y px-6 py-1">
                {(persona === "coach"
                  ? [
                      "Revisar avaliação de um morador",
                      "Conferir execução e relato de uma sessão",
                      "Preparar o próximo encontro",
                    ]
                  : persona === "sindico"
                    ? [
                        "Conferir solicitações de atendimento",
                        "Organizar o próximo encontro",
                        "Consultar infraestrutura da academia",
                      ]
                    : [
                        "Concluir implantação de um condomínio",
                        "Conferir equipe e vínculos",
                        "Acompanhar solicitações operacionais",
                      ]
                ).map((t, i) => (
                  <div key={t} className="flex items-center gap-4 py-5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                      {i === 0 ? (
                        <ClipboardCheck className="h-5 w-5" />
                      ) : i === 1 ? (
                        <MessageSquare className="h-5 w-5" />
                      ) : (
                        <Building2 className="h-5 w-5" />
                      )}
                    </span>
                    <p className="flex-1 text-sm font-semibold">{t}</p>
                    <Button variant="ghost" size="sm">
                      Abrir <ArrowUpRight />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<Review />);
