
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Menu, X, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">
              Safe School Commute
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition-colors">
              How It Works
            </a>
            <a href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors">
              Contact
            </a>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <Link to="/dashboard">
                  <Button variant="outline">Dashboard</Button>
                </Link>
                <Button onClick={signOut} variant="ghost">
                  Sign Out
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button>Get Started</Button>
              </Link>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-4">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition-colors">
                How It Works
              </a>
              <a href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors">
                Contact
              </a>
              
              {user ? (
                <div className="flex flex-col space-y-2">
                  <Link to="/dashboard">
                    <Button variant="outline" className="w-full">Dashboard</Button>
                  </Link>
                  <Button onClick={signOut} variant="ghost" className="w-full">
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Link to="/auth">
                  <Button className="w-full">Get Started</Button>
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
