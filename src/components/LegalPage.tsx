import React from 'react';
import { Shield, AlertTriangle, Eye, Globe, Mail, ArrowLeft, Scale, FileText, Users, Lock } from 'lucide-react';

const LegalPage = () => {
  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-in slide-in-from-top-4 duration-700">
          <button
            onClick={() => window.history.back()}
            className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Retour</span>
          </button>
          
          <div className="glass-dark border border-slate-700/50 rounded-3xl p-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center animate-pulse">
                <Scale className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Mentions Légales</h1>
                <p className="text-slate-400 text-lg">Conditions d'utilisation et responsabilités</p>
              </div>
            </div>
          </div>
        </div>

        {/* Avertissement principal */}
        <div className="glass-dark border border-red-500/30 rounded-3xl p-8 mb-8 animate-in slide-in-from-left-4 duration-700 delay-200">
          <div className="flex items-start space-x-4">
            <AlertTriangle className="h-8 w-8 text-red-400 mt-1 flex-shrink-0" />
            <div>
              <h2 className="text-2xl font-bold text-red-400 mb-4">Avertissement Important</h2>
              <div className="space-y-4 text-slate-300 leading-relaxed">
                <p>
                  <strong>ABD Stream</strong> est une plateforme d'agrégation de liens qui ne stocke, n'héberge, 
                  ni ne distribue aucun contenu multimédia. Nous nous contentons de référencer des liens 
                  vers des contenus hébergés sur des plateformes tierces externes.
                </p>
                <p>
                  <strong>Nous déclinons toute responsabilité</strong> concernant le contenu, la légalité, 
                  la qualité ou l'exactitude des médias diffusés via les liens externes référencés sur notre plateforme.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sections légales */}
        <div className="space-y-8">
          {/* Éditeur du site */}
          <div className="glass-dark border border-slate-700/50 rounded-2xl p-8 animate-in slide-in-from-bottom-4 duration-700 delay-300">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <FileText className="h-6 w-6 mr-3 text-blue-400" />
              Éditeur du Site
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-300">
              <div>
                <h3 className="font-semibold text-white mb-2">Nom du site :</h3>
                <p>ABD Stream</p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Statut :</h3>
                <p>Plateforme d'agrégation de liens</p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Responsable de publication :</h3>
                <p>Équipe ABD Stream</p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Contact :</h3>
                <p>contact@abdstream.com</p>
              </div>
            </div>
          </div>

          {/* Hébergement */}
          <div className="glass-dark border border-slate-700/50 rounded-2xl p-8 animate-in slide-in-from-bottom-4 duration-700 delay-400">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Globe className="h-6 w-6 mr-3 text-green-400" />
              Hébergement
            </h2>
            <div className="text-slate-300 space-y-4">
              <p>
                Ce site est hébergé par des services cloud distribués pour garantir une disponibilité optimale 
                et une protection contre les attaques DDoS.
              </p>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <h3 className="font-semibold text-white mb-2">Infrastructure :</h3>
                <p>Services cloud distribués avec CDN global</p>
              </div>
            </div>
          </div>

          {/* Responsabilité et contenu */}
          <div className="glass-dark border border-slate-700/50 rounded-2xl p-8 animate-in slide-in-from-bottom-4 duration-700 delay-500">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Shield className="h-6 w-6 mr-3 text-orange-400" />
              Responsabilité et Contenu
            </h2>
            <div className="space-y-6 text-slate-300">
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6">
                <h3 className="font-semibold text-orange-400 mb-3">Limitation de Responsabilité</h3>
                <ul className="space-y-2 list-disc list-inside">
                  <li>ABD Stream ne stocke aucun fichier multimédia sur ses serveurs</li>
                  <li>Nous ne contrôlons pas le contenu des sites externes référencés</li>
                  <li>Nous ne sommes pas responsables de la disponibilité des liens externes</li>
                  <li>Nous ne garantissons pas la légalité du contenu des plateformes tierces</li>
                </ul>
              </div>
              
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                <h3 className="font-semibold text-blue-400 mb-3">Rôle de la Plateforme</h3>
                <p>
                  ABD Stream agit uniquement comme un moteur de recherche et un agrégateur de liens. 
                  Notre rôle se limite à :
                </p>
                <ul className="mt-3 space-y-2 list-disc list-inside">
                  <li>Référencer des liens vers des contenus externes</li>
                  <li>Fournir une interface utilisateur pour naviguer</li>
                  <li>Maintenir la sécurité et l'anonymat des utilisateurs</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Propriété intellectuelle */}
          <div className="glass-dark border border-slate-700/50 rounded-2xl p-8 animate-in slide-in-from-bottom-4 duration-700 delay-600">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Eye className="h-6 w-6 mr-3 text-purple-400" />
              Propriété Intellectuelle
            </h2>
            <div className="space-y-6 text-slate-300">
              <div>
                <h3 className="font-semibold text-white mb-3">Droits d'Auteur</h3>
                <p>
                  ABD Stream respecte les droits de propriété intellectuelle. Si vous êtes propriétaire 
                  de droits d'auteur et pensez qu'un contenu référencé porte atteinte à vos droits, 
                  vous pouvez nous contacter via notre procédure DMCA.
                </p>
              </div>
              
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
                <h3 className="font-semibold text-purple-400 mb-3">Procédure DMCA</h3>
                <p>
                  Pour signaler une violation de droits d'auteur, utilisez notre formulaire DMCA dédié. 
                  Nous examinerons toute plainte légitime dans les plus brefs délais.
                </p>
                <a 
                  href="/dmca" 
                  className="inline-flex items-center mt-3 text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Accéder au formulaire DMCA →
                </a>
              </div>
            </div>
          </div>

          {/* Données personnelles */}
          <div className="glass-dark border border-slate-700/50 rounded-2xl p-8 animate-in slide-in-from-bottom-4 duration-700 delay-700">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Lock className="h-6 w-6 mr-3 text-cyan-400" />
              Protection des Données
            </h2>
            <div className="space-y-6 text-slate-300">
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6">
                <h3 className="font-semibold text-cyan-400 mb-3">Anonymat et Confidentialité</h3>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Aucune donnée personnelle n'est collectée sans consentement</li>
                  <li>Nous ne stockons pas d'historique de navigation</li>
                  <li>Les sessions sont chiffrées et temporaires</li>
                  <li>Aucun tracking publicitaire n'est utilisé</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-white mb-3">Cookies et Technologies</h3>
                <p>
                  Nous utilisons uniquement des cookies techniques nécessaires au fonctionnement 
                  de la plateforme. Aucun cookie de tracking ou publicitaire n'est utilisé.
                </p>
              </div>
            </div>
          </div>

          {/* Conditions d'utilisation */}
          <div className="glass-dark border border-slate-700/50 rounded-2xl p-8 animate-in slide-in-from-bottom-4 duration-700 delay-800">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Users className="h-6 w-6 mr-3 text-yellow-400" />
              Conditions d'Utilisation
            </h2>
            <div className="space-y-6 text-slate-300">
              <div>
                <h3 className="font-semibold text-white mb-3">Utilisation Autorisée</h3>
                <p>
                  L'utilisation d'ABD Stream est soumise aux conditions suivantes :
                </p>
                <ul className="mt-3 space-y-2 list-disc list-inside">
                  <li>Utilisation personnelle et non commerciale uniquement</li>
                  <li>Respect des lois en vigueur dans votre juridiction</li>
                  <li>Interdiction de toute activité malveillante</li>
                  <li>Respect des autres utilisateurs</li>
                </ul>
              </div>
              
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
                <h3 className="font-semibold text-yellow-400 mb-3">Responsabilité de l'Utilisateur</h3>
                <p>
                  Chaque utilisateur est responsable de :
                </p>
                <ul className="mt-3 space-y-2 list-disc list-inside">
                  <li>Vérifier la légalité du contenu dans sa juridiction</li>
                  <li>Respecter les droits d'auteur des contenus consultés</li>
                  <li>Utiliser la plateforme de manière éthique et légale</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Modifications */}
          <div className="glass-dark border border-slate-700/50 rounded-2xl p-8 animate-in slide-in-from-bottom-4 duration-700 delay-900">
            <h2 className="text-2xl font-bold text-white mb-6">Modifications des Mentions Légales</h2>
            <div className="text-slate-300 space-y-4">
              <p>
                ABD Stream se réserve le droit de modifier ces mentions légales à tout moment. 
                Les utilisateurs seront informés des modifications importantes via la plateforme.
              </p>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <p className="text-sm">
                  <strong>Dernière mise à jour :</strong> {new Date().toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="glass-dark border border-slate-700/50 rounded-2xl p-8 text-center animate-in slide-in-from-bottom-4 duration-700 delay-1000">
            <Mail className="h-12 w-12 text-cyan-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Contact Légal</h2>
            <p className="text-slate-300 mb-6">
              Pour toute question concernant ces mentions légales ou nos pratiques
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
              <a 
                href="mailto:legal@abdstream.com" 
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105"
              >
                Contact Légal
              </a>
              <a 
                href="mailto:dmca@abdstream.com" 
                className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105"
              >
                Plainte DMCA
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;