import React from 'react'

const Footer: React.FC = () => {
  return (
    <footer className="border-t bg-muted/50 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-semibold mb-4">About</h3>
            <p className="text-sm text-muted-foreground">
              Golf Charity Platform connects golfers with meaningful charitable giving.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Platform</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/charities" className="hover:text-primary">Charities</a></li>
              <li><a href="/dashboard" className="hover:text-primary">Dashboard</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary">Privacy</a></li>
              <li><a href="#" className="hover:text-primary">Terms</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <p className="text-sm text-muted-foreground">
              xyz@golfcharity.com
            </p>
          </div>
        </div>
        <div className="border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 Golf Charity Platform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
