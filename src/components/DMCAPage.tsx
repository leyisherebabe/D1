import React, { useState } from 'react';
import { Shield, AlertTriangle, Mail, FileText, Clock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

const DMCAPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    copyrightWork: '',
    infringingUrl: '',
    description: '',
    goodFaith: false,
    accuracy: false,
    authorization: false
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.goodFaith && formData.accuracy && formData.authorization) {
      setIsSubmitted(true);
      // Ici vous pourriez envoyer les données à votre serveur
      console.log('DMCA Notice submitted:', formData);
    } else {
      alert('Veuillez cocher toutes les déclarations requises.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-950 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="glass-dark border border-green-500/30 rounded-3xl p-12 text-center animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-6">Plainte DMCA Reçue</h1>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Votre plainte DMCA a été soumise avec succès. Nous examinerons votre demande dans les plus brefs délais.
            </p>
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-green-400 mb-4">Prochaines étapes :</h3>
              <div className="text-left space-y-3 text-slate-300">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Examen de votre plainte sous 24-48h</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Notification par email de la décision</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Action appropriée si la plainte est validée</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all transform hover:scale-105"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

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
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center animate-pulse">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Plainte DMCA</h1>
                <p className="text-slate-400 text-lg">Digital Millennium Copyright Act</p>
              </div>
            </div>
            
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-6 w-6 text-orange-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-orange-400 mb-2">Information Importante</h3>
                  <p className="text-slate-300 leading-relaxed">
                    ABD Stream agit uniquement comme un agrégateur de liens vers des contenus hébergés sur des plateformes externes. 
                    Nous ne stockons, n'hébergeons ni ne distribuons directement aucun contenu protégé par des droits d'auteur.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Formulaire DMCA */}
        <div className="glass-dark border border-slate-700/50 rounded-3xl p-8 animate-in slide-in-from-bottom-4 duration-700 delay-200">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center">
            <FileText className="h-6 w-6 mr-3 text-red-400" />
            Formulaire de Plainte DMCA
          </h2>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Informations du plaignant */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white border-b border-slate-700 pb-3">
                Informations du Plaignant
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full h-12 bg-slate-800 border border-slate-600 rounded-xl px-4 text-white placeholder-slate-400 focus:border-red-400 focus:outline-none focus:ring-4 focus:ring-red-400/20 transition-all"
                    placeholder="Votre nom complet"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Adresse email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full h-12 bg-slate-800 border border-slate-600 rounded-xl px-4 text-white placeholder-slate-400 focus:border-red-400 focus:outline-none focus:ring-4 focus:ring-red-400/20 transition-all"
                    placeholder="votre@email.com"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Société/Organisation (optionnel)
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="w-full h-12 bg-slate-800 border border-slate-600 rounded-xl px-4 text-white placeholder-slate-400 focus:border-red-400 focus:outline-none focus:ring-4 focus:ring-red-400/20 transition-all"
                  placeholder="Nom de votre société"
                />
              </div>
            </div>

            {/* Informations sur l'œuvre */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white border-b border-slate-700 pb-3">
                Informations sur l'Œuvre Protégée
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description de l'œuvre protégée *
                </label>
                <textarea
                  name="copyrightWork"
                  value={formData.copyrightWork}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:border-red-400 focus:outline-none focus:ring-4 focus:ring-red-400/20 transition-all resize-none"
                  placeholder="Décrivez l'œuvre protégée par des droits d'auteur..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  URL du contenu en infraction *
                </label>
                <input
                  type="url"
                  name="infringingUrl"
                  value={formData.infringingUrl}
                  onChange={handleInputChange}
                  required
                  className="w-full h-12 bg-slate-800 border border-slate-600 rounded-xl px-4 text-white placeholder-slate-400 focus:border-red-400 focus:outline-none focus:ring-4 focus:ring-red-400/20 transition-all"
                  placeholder="https://exemple.com/contenu-en-infraction"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description détaillée de l'infraction *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:border-red-400 focus:outline-none focus:ring-4 focus:ring-red-400/20 transition-all resize-none"
                  placeholder="Expliquez en détail comment vos droits d'auteur sont violés..."
                />
              </div>
            </div>

            {/* Déclarations légales */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white border-b border-slate-700 pb-3">
                Déclarations Légales Requises
              </h3>
              
              <div className="space-y-4">
                <label className="flex items-start space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="goodFaith"
                    checked={formData.goodFaith}
                    onChange={handleInputChange}
                    className="mt-1 w-5 h-5 text-red-500 bg-slate-800 border-slate-600 rounded focus:ring-red-400 focus:ring-2"
                  />
                  <span className="text-slate-300 group-hover:text-white transition-colors">
                    Je déclare de bonne foi que l'utilisation du matériel décrit ci-dessus n'est pas autorisée par le propriétaire des droits d'auteur, son agent ou la loi.
                  </span>
                </label>
                
                <label className="flex items-start space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="accuracy"
                    checked={formData.accuracy}
                    onChange={handleInputChange}
                    className="mt-1 w-5 h-5 text-red-500 bg-slate-800 border-slate-600 rounded focus:ring-red-400 focus:ring-2"
                  />
                  <span className="text-slate-300 group-hover:text-white transition-colors">
                    Je déclare que les informations contenues dans cette notification sont exactes et, sous peine de parjure, que je suis autorisé à agir au nom du propriétaire des droits d'auteur.
                  </span>
                </label>
                
                <label className="flex items-start space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="authorization"
                    checked={formData.authorization}
                    onChange={handleInputChange}
                    className="mt-1 w-5 h-5 text-red-500 bg-slate-800 border-slate-600 rounded focus:ring-red-400 focus:ring-2"
                  />
                  <span className="text-slate-300 group-hover:text-white transition-colors">
                    Je confirme que je suis le propriétaire des droits d'auteur ou que je suis autorisé à agir au nom du propriétaire des droits d'auteur.
                  </span>
                </label>
              </div>
            </div>

            {/* Bouton de soumission */}
            <div className="pt-6 border-t border-slate-700">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white py-4 px-6 rounded-2xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-2xl"
              >
                Soumettre la Plainte DMCA
              </button>
              
              <p className="text-sm text-slate-400 mt-4 text-center">
                En soumettant ce formulaire, vous acceptez que vos informations soient traitées conformément à notre politique de confidentialité.
              </p>
            </div>
          </form>
        </div>

        {/* Informations supplémentaires */}
        <div className="mt-8 glass-dark border border-slate-700/50 rounded-2xl p-6 animate-in slide-in-from-bottom-4 duration-700 delay-400">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-400" />
            Délais de Traitement
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <div className="text-blue-400 font-semibold mb-2">Accusé de réception</div>
              <div className="text-slate-300">Sous 24 heures</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <div className="text-yellow-400 font-semibold mb-2">Examen de la plainte</div>
              <div className="text-slate-300">2-5 jours ouvrés</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <div className="text-green-400 font-semibold mb-2">Décision finale</div>
              <div className="text-slate-300">7-10 jours ouvrés</div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-8 text-center animate-in fade-in-0 duration-700 delay-600">
          <div className="glass-dark border border-slate-700/50 rounded-2xl p-6">
            <Mail className="h-8 w-8 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Contact DMCA</h3>
            <p className="text-slate-400 mb-4">
              Pour toute question concernant les droits d'auteur ou les plaintes DMCA
            </p>
            <a 
              href="mailto:dmca@abdstream.com" 
              className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              dmca@abdstream.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DMCAPage;