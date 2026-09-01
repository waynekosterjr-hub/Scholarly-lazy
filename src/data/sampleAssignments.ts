import { AssignmentRubric, ScholarlyPaper, OutlineSection } from '../types';

export interface SampleScenario {
  id: string;
  name: string;
  category: string;
  thesis: string;
  rubric: AssignmentRubric;
  samplePapers: ScholarlyPaper[];
  sampleOutline: OutlineSection[];
  initialDraft: string;
}

export const SAMPLE_ASSIGNMENTS: SampleScenario[] = [
  {
    id: 'cognitive-psych',
    name: 'Cognitive Impact of Short-Form Video Feeds on Adolescent Attention',
    category: 'Cognitive Psychology & Neuroscience',
    thesis: 'While short-form algorithmic video platforms provide rapid micro-learning benefits, excessive daily exposure significantly impairs sustained executive attention in adolescents through continuous dopamine reward loops and fragmented cognitive switching.',
    rubric: {
      title: 'Empirical Literature Review: Algorithmic Media & Adolescent Cognitive Control',
      courseName: 'PSYC 4020: Advanced Developmental Cognitive Neuroscience',
      assignmentType: 'Scholarly Literature Review & Critical Analysis',
      requiredWordCount: { min: 1800, max: 2500, target: 2000 },
      requiredCitationStyle: 'APA7',
      requiredSourceCount: 4,
      deadline: '2026-10-15',
      topicConstraints: [
        'Must focus on empirical neuroscience or cognitive psychology studies from 2020-present',
        'Must include both supporting cognitive impairment evidence and counter-perspectives (e.g. digital literacy/micro-learning)',
        'Must analyze executive function, working memory, and dopamine circuitry',
      ],
      keyQuestionsToAnswer: [
        'How does intermittent algorithmic reinforcement in short-form video feeds alter prefrontal cortex activation in adolescents?',
        'What empirical evidence exists regarding working memory degradation versus task-switching adaptation?',
        'What methodological limitations exist in current self-reported screen time research?',
      ],
      formattingRules: [
        'Standard APA 7th Edition with 1-inch margins, Times New Roman 12pt, double spacing',
        'Title page with institutional affiliation and running header',
        'Alphabetized References section with 0.5-inch hanging indent',
      ],
      criteria: [
        {
          id: 'crit-1',
          category: 'Theoretical Grounding & Thesis Clarity',
          description: 'Clearly articulates a neurocognitive thesis integrating dual-process theory and algorithmic reward dynamics.',
          weight: 25,
          status: 'fulfilled',
          guidelines: ['Explicit thesis statement in introduction', 'Clear operationalization of cognitive control and executive attention'],
        },
        {
          id: 'crit-2',
          category: 'Synthesis of Peer-Reviewed Literature',
          description: 'Critically evaluates at least 4 seminal empirical studies, comparing methodologies and neuroimaging findings.',
          weight: 35,
          status: 'fulfilled',
          guidelines: ['Use peer-reviewed empirical studies', 'Directly synthesize empirical metrics rather than simply summarizing papers'],
        },
        {
          id: 'crit-3',
          category: 'Counter-Argumentation & Nuance',
          description: 'Addresses alternative interpretations such as selective attention adaptability and socioeconomic confounding factors.',
          weight: 20,
          status: 'partially_met',
          guidelines: ['Include dedicated counter-analysis section', 'Assess methodological validity of contradictory findings'],
        },
        {
          id: 'crit-4',
          category: 'APA 7th Edition Citations & Academic Mechanics',
          description: 'Flawless in-text citation formatting, parenthetical vs narrative styles, and complete bibliography references.',
          weight: 20,
          status: 'fulfilled',
          guidelines: ['Correct (Author et al., Year) formatting', 'Complete reference list with DOIs'],
        },
      ],
      rawExtractedText: `PSYC 4020: Advanced Developmental Cognitive Neuroscience
Final Research Paper Assignment (2,000 words, APA 7)
Topic: Examine the neurocognitive consequences of algorithmic short-form media on adolescent executive function.
Requirements: 4+ peer-reviewed sources, APA 7 format, structured critical synthesis with counter-arguments.`,
    },
    samplePapers: [
      {
        paperId: 'paper-psych-01',
        title: 'Algorithmic Reinforcement and Prefrontal Cortex Engagement in Adolescent Social Media Use',
        authors: [{ name: 'Elena Rostova' }, { name: 'Marcus Sterling' }, { name: 'David K. Zhao' }],
        year: 2023,
        abstract: 'Using fMRI neuroimaging across 340 adolescents (ages 13-17), this longitudinal study demonstrated that algorithmic video feeds trigger hyper-sensitized ventral striatum activation while dampening dorsolateral prefrontal cortex (dlPFC) regulation during prolonged sustained attention tasks.',
        venue: 'Journal of Cognitive Neuroscience',
        citationCount: 142,
        doi: '10.1162/jocn_a_01945',
        url: 'https://doi.org/10.1162/jocn_a_01945',
        selected: true,
      },
      {
        paperId: 'paper-psych-02',
        title: 'Continuous Cognitive Switching: Working Memory Capacity in the Age of Micro-Content',
        authors: [{ name: 'Sarah Jenkins' }, { name: 'Brian O’Connor' }],
        year: 2024,
        abstract: 'An empirical investigation of n-back task performance among 520 high school students revealed a 19.4% drop in dual-task working memory efficiency among heavy consumers (>3 hours/day) of rapid-transition digital media, driven primarily by continuous context swapping.',
        venue: 'Developmental Psychology Review',
        citationCount: 88,
        doi: '10.1037/dev0001489',
        url: 'https://doi.org/10.1037/dev0001489',
        selected: true,
      },
      {
        paperId: 'paper-psych-03',
        title: 'Micro-Learning and Digital Adaptability: Challenging Deficit Narratives in Youth Attention',
        authors: [{ name: 'Amina Al-Mansoor' }, { name: 'Kenneth Patel' }],
        year: 2023,
        abstract: 'Contrasting prevailing deficit frameworks, this quasi-experimental study found that short-form educational video consumption improved rapid pattern recognition and visual search speed by 14%, suggesting neural adaptation toward dynamic filtering rather than pure attentional deficit.',
        venue: 'Computers & Human Behavior',
        citationCount: 65,
        doi: '10.1016/j.chb.2023.107789',
        url: 'https://doi.org/10.1016/j.chb.2023.107789',
        selected: true,
      },
      {
        paperId: 'paper-psych-04',
        title: 'Methodological Limitations in Screen-Time Research: The Self-Report Confound',
        authors: [{ name: 'Thomas Lindqvist' }, { name: 'Helena Berg' }],
        year: 2022,
        abstract: 'A meta-analysis of 85 screen-time studies highlights that subjective self-reporting accounts for up to 48% variance error when compared to objective telemetry logs, necessitating cautious interpretation of causal claims in adolescent cognitive decline.',
        venue: 'Nature Human Behaviour',
        citationCount: 210,
        doi: '10.1038/s41562-022-01412-x',
        url: 'https://doi.org/10.1038/s41562-022-01412-x',
        selected: true,
      },
    ],
    sampleOutline: [
      {
        id: 'sec-1',
        heading: 'Introduction and Theoretical Framework',
        description: 'Establish the rise of algorithmic recommendation engines, dual-process cognitive architecture, and present the core thesis.',
        targetWordCount: 350,
        status: 'completed',
        points: [
          {
            id: 'p1-1',
            title: 'Digital Acceleration in Adolescent Development',
            description: 'Contextualize average daily short-form media engagement among youth.',
            citedPaperIds: ['paper-psych-01'],
          },
          {
            id: 'p1-2',
            title: 'Thesis Statement',
            description: 'State that short-form feeds impair sustained executive control despite niche perceptual search gains.',
            citedPaperIds: [],
          },
        ],
      },
      {
        id: 'sec-2',
        heading: 'Neurobiological Mechanisms: Dopaminergic Circuitry & Executive Control',
        description: 'Examine fMRI and EEG findings linking variable interval reward schedules with reduced dlPFC inhibition.',
        targetWordCount: 550,
        status: 'completed',
        points: [
          {
            id: 'p2-1',
            title: 'Striatal Activation & dlPFC Hypo-regulation',
            description: 'Synthesize neuroimaging evidence showing striatal hyper-reactivity under algorithmic feeds.',
            citedPaperIds: ['paper-psych-01'],
          },
          {
            id: 'p2-2',
            title: 'Working Memory Fragmentation in N-Back Tasks',
            description: 'Evaluate cognitive load theory and context-switching costs.',
            citedPaperIds: ['paper-psych-02'],
          },
        ],
      },
      {
        id: 'sec-3',
        heading: 'Counter-Perspectives: Cognitive Adaptation and Visual Search Agility',
        description: 'Present the alternative view that youth are developing adaptive dynamic filtering rather than pure attentional deficit.',
        targetWordCount: 450,
        status: 'completed',
        points: [
          {
            id: 'p3-1',
            title: 'Dynamic Perceptual Salience & Micro-Learning',
            description: 'Highlight empirical gains in rapid visual pattern matching.',
            citedPaperIds: ['paper-psych-03'],
            isCounterArgument: true,
          },
          {
            id: 'p3-2',
            title: 'Rebuttal: Shallow Encoding vs Deep Comprehension',
            description: 'Contrast surface visual search speed with long-term semantic retention.',
            citedPaperIds: ['paper-psych-02'],
          },
        ],
      },
      {
        id: 'sec-4',
        heading: 'Methodological Critiques and Synthesis',
        description: 'Address empirical limitations regarding self-reported media consumption and establish guidelines for future telemetry studies.',
        targetWordCount: 350,
        status: 'completed',
        points: [
          {
            id: 'p4-1',
            title: 'The Self-Report Discrepancy in Screen Research',
            description: 'Demonstrate measurement error in subjective survey instruments.',
            citedPaperIds: ['paper-psych-04'],
          },
        ],
      },
      {
        id: 'sec-5',
        heading: 'Conclusion and Developmental Implications',
        description: 'Synthesize findings, reiterate theoretical contribution, and propose institutional and pedagogical interventions.',
        targetWordCount: 300,
        status: 'completed',
        points: [
          {
            id: 'p5-1',
            title: 'Synthesis of Dual-Process Findings',
            description: 'Reinforce that structural attention deficits require proactive digital hygiene frameworks.',
            citedPaperIds: [],
          },
        ],
      },
    ],
    initialDraft: `# The Cognitive Costs of Algorithmic Acceleration: Evaluating Executive Control and Working Memory in Adolescent Media Consumption

## Introduction and Theoretical Framework
Over the past decade, adolescent digital consumption has shifted dramatically from static web interactions to algorithmically curated micro-video platforms. These platforms utilize variable-ratio reinforcement schedules that dynamically adapt to micro-behaviors such as watch duration, pause frequency, and replay patterns. While contemporary digital literacy advocates suggest these rapid interfaces cultivate dynamic information foraging, emerging developmental neuroscience indicates that continuous exposure during critical neurodevelopmental windows exacts substantial cognitive costs. Specifically, this paper argues that while algorithmic micro-content platforms may sharpen superficial visual search agility, their sustained usage significantly compromises top-down executive attention and working memory capacity by habituating neural circuits to continuous dopaminergic stimulation (Rostova et al., 2023).

## Neurobiological Mechanisms: Dopaminergic Circuitry & Executive Control
The core of adolescent cognitive vulnerability lies in the asynchronous maturation of the socioemotional and cognitive control networks. In an extensive fMRI investigation of 340 adolescents, Rostova et al. (2023) demonstrated that algorithmic feeds trigger heightened responsiveness in the ventral striatum while simultaneously attenuating blood-oxygen-level-dependent (BOLD) responses in the dorsolateral prefrontal cortex (dlPFC) during subsequent sustained attention tasks. This neurochemical dynamic reinforces an immediate reward loop, reducing the child's tolerance for prolonged cognitive tasks that lack frequent sensory stimuli.

Complementing these neuroimaging observations, behavioral performance on standardized cognitive assessments reveals tangible deficits in working memory manipulation. Jenkins and O’Connor (2024) tested 520 high school students on visual and auditory n-back tasks and observed a 19.4% reduction in dual-task operational accuracy among individuals consuming more than three hours of short-form micro-content daily. The authors attributed this degradation to continuous context swapping, which continually evicts active mental representations from the phonological loop and visuospatial sketchpad before deep semantic consolidation can occur (Jenkins & O’Connor, 2024).

## Counter-Perspectives: Cognitive Adaptation and Visual Search Agility
Despite widespread public concern regarding attention deficit crises, alternative frameworks propose that adolescent neural architecture is undergoing functional adaptation rather than pure pathology. Al-Mansoor and Patel (2023) conducted a quasi-experimental evaluation of youth engaging with educational micro-media and documented a 14% improvement in rapid visual pattern discrimination and search latency. The researchers argued that youth are cultivating high-speed information triage mechanisms, prioritizing quick relevance filtering over exhaustive evaluation (Al-Mansoor & Patel, 2023).

However, while perceptual filtering speed undeniably increases, this adaptation appears to occur at the direct expense of deep conceptual synthesis. When Al-Mansoor and Patel (2023)'s findings are cross-referenced with the memory retention models of Jenkins and O’Connor (2024), it becomes evident that high-speed perceptual triage does not translate into robust long-term retention. Rapid scanning facilitates superficial familiarity, yet fails to activate the associative pathways required for complex problem-solving and philosophical reasoning.

## Methodological Critiques and Synthesis
A critical limitation confounding current literature is the historical reliance on retrospective self-reporting for media usage metrics. As Lindqvist and Berg (2022) highlighted in their meta-analysis of 85 developmental studies, self-reported screen time suffers from an average variance error of 48% when calibrated against objective background telemetry logs. Heavy users frequently underestimate passive scrolling duration by more than two hours daily, while intermittent users overreport focused engagement (Lindqvist & Berg, 2022). Consequently, while the causal link between algorithmic reinforcement and dlPFC attenuation is robustly established in laboratory settings (Rostova et al., 2023), population-level ecological validity demands future studies incorporating passive on-device telemetry and objective biometric monitoring.

## Conclusion and Developmental Implications
In conclusion, the intersection of algorithmic recommendation systems and adolescent neurodevelopment presents an unprecedented cognitive challenge. The empirical evidence demonstrates a clear tension between rapid perceptual triage (Al-Mansoor & Patel, 2023) and sustained executive control (Rostova et al., 2023; Jenkins & O’Connor, 2024). Educational institutions and technology architects must move beyond simplistic abstinence rhetoric and instead design environmental interventions that preserve deep cognitive endurance in an increasingly fragmented digital ecosystem.`,
  },
  {
    id: 'environmental-econ',
    name: 'Carbon Pricing vs Direct Subsidies in Accelerating Clean Tech',
    category: 'Environmental Economics & Public Policy',
    thesis: 'While revenue-neutral carbon taxation provides the most economically efficient broad-based abatement signal, targeted direct green subsidies are politically and technologically superior for overcoming early-stage clean technology deployment barriers.',
    rubric: {
      title: 'Comparative Policy Analysis: Market Instruments in Climate Economics',
      courseName: 'ECON 3450: Environmental & Resource Economics',
      assignmentType: 'Policy White Paper & Empirical Comparative Review',
      requiredWordCount: { min: 1600, max: 2200, target: 1900 },
      requiredCitationStyle: 'APA7',
      requiredSourceCount: 4,
      deadline: '2026-11-01',
      topicConstraints: [
        'Must compare market-based carbon pricing (taxes/cap-and-trade) against command-and-control or subsidy frameworks',
        'Must include deadweight loss and distributional equity considerations',
        'Must incorporate empirical case studies from EU ETS or North American regional systems',
      ],
      keyQuestionsToAnswer: [
        'What is the marginal abatement cost curve difference between carbon taxes and clean tech subsidies?',
        'How do border carbon adjustments resolve trade leakage concerns?',
        'What equity mechanisms prevent regressive impacts on low-income households?',
      ],
      formattingRules: ['APA 7th Edition', 'Numbered headings and subheadings', 'Clear policy recommendations matrix'],
      criteria: [
        {
          id: 'crit-e1',
          category: 'Economic Theory & Marginal Abatement Modeling',
          description: 'Demonstrates deep comprehension of Pigouvian taxation, deadweight loss, and technological learning curves.',
          weight: 30,
          status: 'fulfilled',
          guidelines: ['Incorporate marginal abatement cost concepts', 'Contrast price vs quantity instruments'],
        },
        {
          id: 'crit-e2',
          category: 'Empirical Evidence & Literature Synthesis',
          description: 'Synthesizes at least 4 peer-reviewed economic studies with quantitative elasticity data.',
          weight: 35,
          status: 'fulfilled',
          guidelines: ['Use peer-reviewed econometric literature', 'Provide specific empirical cost figures'],
        },
        {
          id: 'crit-e3',
          category: 'Distributional Equity & Policy Feasibility',
          description: 'Evaluates revenue recycling mechanisms to mitigate regressive energy burdens on vulnerable demographics.',
          weight: 20,
          status: 'fulfilled',
          guidelines: ['Discuss lump-sum dividends vs tax cuts', 'Analyze political economy resistance'],
        },
        {
          id: 'crit-e4',
          category: 'Scholarly Writing & APA Formatting',
          description: 'Adheres strictly to academic mechanics, precise economic nomenclature, and APA 7 referencing.',
          weight: 15,
          status: 'fulfilled',
          guidelines: ['Accurate in-text citation', 'Full bibliography entries with DOIs'],
        },
      ],
    },
    samplePapers: [
      {
        paperId: 'paper-econ-01',
        title: 'Empirical Price Elasticity of Industrial Emissions Under the EU ETS',
        authors: [{ name: 'Mathias De Vries' }, { name: 'Lucia Fontana' }],
        year: 2023,
        abstract: 'Analyzing 4,200 regulated industrial facilities across Phase III of the EU Emissions Trading System, this econometric study identifies an average carbon price elasticity of -0.32, proving significant abatement once prices exceed €65 per tonne of CO2 equivalent.',
        venue: 'Journal of Environmental Economics and Management',
        citationCount: 112,
        doi: '10.1016/j.jeem.2023.102830',
        url: 'https://doi.org/10.1016/j.jeem.2023.102830',
        selected: true,
      },
      {
        paperId: 'paper-econ-02',
        title: 'Technology Spillover vs Price Signals: The Efficacy of Green Subsidies in Early-Stage Scaling',
        authors: [{ name: 'Robert C. Hendershot' }, { name: 'Mei-Ling Zhou' }],
        year: 2024,
        abstract: 'Through comparative modeling of solar PV and green hydrogen adoption across 28 OECD countries, this study shows that direct capital expenditure subsidies reduce unit costs along the learning curve 2.8 times faster than carbon prices alone by mitigating investor risk.',
        venue: 'Resource and Energy Economics',
        citationCount: 74,
        doi: '10.1016/j.reseneeco.2024.101452',
        url: 'https://doi.org/10.1016/j.reseneeco.2024.101452',
        selected: true,
      },
      {
        paperId: 'paper-econ-03',
        title: 'Progressive Dividends in Carbon Taxation: Addressing the Regressivity Paradox',
        authors: [{ name: 'Catherine E. Vance' }, { name: 'Jonathan Thorne' }],
        year: 2022,
        abstract: 'Examining household expenditure surveys in Canada and Sweden, this paper reveals that recycling 100% of carbon revenue as universal flat dividends transforms a gross regressive tax into a net progressive wealth transfer for the bottom four income deciles.',
        venue: 'National Tax Journal',
        citationCount: 198,
        doi: '10.1086/719401',
        url: 'https://doi.org/10.1086/719401',
        selected: true,
      },
      {
        paperId: 'paper-econ-04',
        title: 'Border Carbon Adjustments and International Leakage Dynamics in Heavy Manufacturing',
        authors: [{ name: 'Arjun Sen' }, { name: 'Eva Lindemann' }],
        year: 2023,
        abstract: 'Simulating the EU Carbon Border Adjustment Mechanism (CBAM) against steel and cement imports, this paper calculates a 78% reduction in carbon leakage risk while incentivizing trade partners to implement domestic carbon accounting standards.',
        venue: 'World Economy & Trade Review',
        citationCount: 95,
        doi: '10.1111/wetr.12450',
        url: 'https://doi.org/10.1111/wetr.12450',
        selected: true,
      },
    ],
    sampleOutline: [
      {
        id: 'econ-sec-1',
        heading: 'Executive Summary and Theoretical Foundation',
        description: 'Introduce Pigouvian carbon taxation, clean tech learning curves, and thesis on policy hybridity.',
        targetWordCount: 350,
        status: 'completed',
        points: [],
      },
      {
        id: 'econ-sec-2',
        heading: 'The Power of the Price Signal: Empirical Evidence from Carbon Markets',
        description: 'Evaluate price elasticity and industrial decarbonization.',
        targetWordCount: 500,
        status: 'completed',
        points: [],
      },
      {
        id: 'econ-sec-3',
        heading: 'The Case for Direct Subsidies in Overcoming Valley-of-Death Bottlenecks',
        description: 'Examine learning curve acceleration and high upfront Capex technologies.',
        targetWordCount: 450,
        status: 'completed',
        points: [],
      },
      {
        id: 'econ-sec-4',
        heading: 'Equity, Revenue Recycling, and International Trade Leakage',
        description: 'Synthesize carbon dividend mechanisms and border adjustments.',
        targetWordCount: 400,
        status: 'completed',
        points: [],
      },
    ],
    initialDraft: `# Market Mechanisms in Decarbonization: Synthesizing Carbon Taxation and Direct Technology Subsidies

## Executive Summary and Theoretical Foundation
The design of effective climate policy represents one of the most critical challenges in modern environmental economics. Traditional neoclassical welfare economics, founded on Pigouvian principles, identifies uniform carbon pricing as the optimal first-best instrument for internalizing the negative externalities of greenhouse gas emissions. However, contemporary empirical investigations demonstrate that carbon pricing alone is insufficient to surmount deep market failures related to early-stage technological risk, knowledge spillovers, and infrastructure coordination. This paper evaluates the comparative efficacy of carbon taxation versus targeted capital subsidies, arguing that optimal policy requires a deliberate hybrid framework: broad carbon pricing to establish macroeconomic abatement signals, coupled with targeted capital subsidies to accelerate clean technologies through the early steep slopes of their learning curves (De Vries & Fontana, 2023; Hendershot & Zhou, 2024).

## The Power of the Price Signal: Empirical Evidence from Carbon Markets
When carbon markets establish credible, escalating price trajectories, industrial actors systematically adjust operational efficiencies and capital expenditure. In an extensive empirical analysis of 4,200 regulated industrial facilities under Phase III of the EU Emissions Trading System (ETS), De Vries and Fontana (2023) documented a statistically significant carbon price elasticity of -0.32 once allowance prices exceeded €65 per tonne of CO2 equivalent. Facilities subjected to robust pricing signals demonstrated accelerated adoption of fuel-switching and waste-heat recovery technologies compared to unregulated peers (De Vries & Fontana, 2023).

## The Case for Direct Subsidies in Overcoming Valley-of-Death Bottlenecks
Despite the macroeconomic efficiency of carbon taxation, price signals exhibit diminished efficacy when applied to nascent technologies characterized by severe capital intensity and high technological uncertainty. Hendershot and Zhou (2024) demonstrated through multi-country econometric modeling that direct capital expenditure grants and production tax credits compress technology cost trajectories along the learning curve 2.8 times faster than carbon pricing alone. For breakthrough applications such as green hydrogen and long-duration storage, early subsidy de-risking provides the certainty required to mobilize private venture capital (Hendershot & Zhou, 2024).

## Equity, Revenue Recycling, and International Trade Leakage
A primary political obstacle to carbon taxation is its inherent regressivity, as lower-income households allocate a larger fraction of disposable income to energy and heating. However, Vance and Thorne (2022) established that returning 100% of carbon tax receipts via equal lump-sum dividends transforms the policy into a net progressive wealth redistribution, leaving the bottom 40% of households financially better off even before accounting for long-term climate benefits. Furthermore, Sen and Lindemann (2023) demonstrated that pairing domestic carbon taxes with Carbon Border Adjustment Mechanisms (CBAM) mitigates 78% of industrial carbon leakage risk, neutralizing competitiveness concerns.

## Policy Synthesis
Policymakers must therefore discard the false dichotomy between market pricing and state technology subsidization. A unified policy framework should establish an escalating floor on carbon prices (De Vries & Fontana, 2023) to drive baseline efficiency, while simultaneously channeling a portion of carbon revenues into targeted technology subsidies (Hendershot & Zhou, 2024) and universal equity dividends (Vance & Thorne, 2022).`,
  },
];
