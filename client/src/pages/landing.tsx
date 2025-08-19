import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-purple/10 via-primary-blue/10 to-success-green/10">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg relative">
        <div className="px-6 py-12">
          {/* Logo and Title */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-accent-purple rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <span className="text-2xl">🔥</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Hot Take</h1>
            <p className="text-gray-600">Social predictions on Base & Farcaster</p>
          </div>

          {/* Features */}
          <div className="space-y-4 mb-12">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <span className="mr-3">📊</span>
                  Stake on Predictions
                </CardTitle>
                <CardDescription>
                  Put your conviction where your mouth is. Stake points on hot takes and predictions.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <span className="mr-3">🏆</span>
                  Build Reputation
                </CardTitle>
                <CardDescription>
                  Earn points and climb the leaderboard with accurate predictions and smart takes.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <span className="mr-3">🎯</span>
                  Infinite Feed
                </CardTitle>
                <CardDescription>
                  TikTok-style endless scroll of predictions across tech, sports, crypto, and more.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button 
              size="lg" 
              className="w-full bg-accent-purple hover:bg-accent-purple/90 text-white font-semibold py-4 text-lg"
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-login"
            >
              Get Started
            </Button>
            <p className="text-sm text-gray-500 mt-4">
              Start with 1,000 free points
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
